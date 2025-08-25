import { productModel } from "../models/Product.js";
import { Stake, StakeReturn } from "../models/stake.model.js";
import User from "../models/User.js";

export const handleStake = async (req, res) => {
  try {
    const { userId, productId, amount, referredBy } = req.body;

    // Validation
    if (!userId || !productId || !amount) {
      return res.status(400).json({
        success: false,
        message:
          "Missing required fields: userId, productId, and amount are required",
      });
    }

    // Convert amount to number
    const stakeAmount = parseFloat(amount);
    if (isNaN(stakeAmount) || stakeAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid stake amount",
      });
    }

    // Find the product
    const product = await productModel.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Check if product is active
    if (product.status !== "active") {
      return res.status(400).json({
        success: false,
        message: "Product is not active for staking",
      });
    }

    // Validate amount range (Frontend validation ka backend confirmation)
    if (
      stakeAmount < product.priceRange.min ||
      stakeAmount > product.priceRange.max
    ) {
      return res.status(400).json({
        success: false,
        message: `Stake amount must be between $${product.priceRange.min} and $${product.priceRange.max}`,
      });
    }

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if user has sufficient balance
    if (user.availableBalance < stakeAmount) {
      return res.status(400).json({
        success: false,
        message: `Insufficient balance. Available: $${user.availableBalance}, Required: $${stakeAmount}`,
      });
    }

    // Calculate returns and fees
    const incomePercentage = product.income; // 2.3%
    const handlingFee = product.handlingFee; // 2.3

    // ✅ FIXED: Duration handling - check if it's string or number
    let duration;
    if (typeof product.duration === "string") {
      // If duration is string like "7 days", extract number
      duration = parseInt(product.duration.replace(/\D/g, ""));
    } else if (typeof product.duration === "number") {
      // If duration is already number
      duration = product.duration;
    } else {
      // Default fallback
      duration = 7;
    }

    // Validate duration
    if (isNaN(duration) || duration <= 0) {
      duration = 7; // Default fallback
    }

    // Calculate profit (2.3% of stake amount)
    const profitAmount = (stakeAmount * incomePercentage) / 100;

    // Calculate maturity date (current date + duration days)
    const maturityDate = new Date();
    maturityDate.setDate(maturityDate.getDate() + duration);

    // Create stake record
    const newStake = new Stake({
      userId: userId,
      productId: productId,
      productTitle: product.title,
      stakeAmount: stakeAmount,
      incomePercentage: incomePercentage,
      profitAmount: profitAmount,
      handlingFee: handlingFee,
      duration: duration,
      maturityDate: maturityDate,
      referredBy: referredBy || null,
      status: "active",
      createdAt: new Date(),
      attachment: req.file ? req.file.path : null,
    });

    // Save stake record
    await newStake.save();

    // Update user's available balance (subtract stake amount)
    user.availableBalance = Number(user.availableBalance) - stakeAmount;

    // Add to user's total staked amount (optional field)
    if (!user.totalStaked) {
      user.totalStaked = 0;
    }
    user.totalStaked = Number(user.totalStaked) + stakeAmount;

    // Save user updates
    await user.save();

    // Schedule automatic return after duration
    const returnRecord = new StakeReturn({
      stakeId: newStake._id,
      userId: userId,
      originalAmount: stakeAmount,
      profitAmount: profitAmount,
      totalReturnAmount: stakeAmount + profitAmount - handlingFee,
      handlingFee: handlingFee,
      maturityDate: maturityDate,
      status: "pending",
      createdAt: new Date(),
    });

    await returnRecord.save();

    // Return success response
    res.status(201).json({
      success: true,
      message: "Stake created successfully",
      data: {
        stake: {
          _id: newStake._id,
          userId: userId,
          productTitle: product.title,
          stakeAmount: stakeAmount,
          profitAmount: profitAmount,
          handlingFee: handlingFee,
          duration: duration,
          maturityDate: maturityDate,
          status: "active",
          createdAt: newStake.createdAt,
        },
        userBalance: {
          previousBalance: Number(user.availableBalance) + stakeAmount,
          currentBalance: Number(user.availableBalance),
          totalStaked: Number(user.totalStaked),
        },
        returns: {
          expectedProfit: profitAmount,
          handlingFee: handlingFee,
          netReturn: profitAmount - handlingFee,
          totalReturn: stakeAmount + profitAmount - handlingFee,
          maturityDate: maturityDate,
          durationDays: duration,
        },
      },
    });
  } catch (error) {
    console.error("Stake creation error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

export const processMaturedStakes = async () => {
  try {
    const currentDate = new Date();

    // Find all pending returns that have matured
    const maturedReturns = await StakeReturn.find({
      status: "pending",
      maturityDate: { $lte: currentDate },
    });

    console.log(`Found ${maturedReturns.length} matured stakes to process`);

    for (const returnRecord of maturedReturns) {
      try {
        // Find the user
        const user = await User.findById(returnRecord.userId);
        if (!user) {
          console.log(`User ${returnRecord.userId} not found, skipping...`);
          continue;
        }

        const netProfit =
          Number(returnRecord.profitAmount) - Number(returnRecord.handlingFee);

        user.walletBalance =
          Number(user.walletBalance || 0) + netProfit;

        // Add total return to user's available balance
        user.availableBalance =
          Number(user.availableBalance) +
          Number(returnRecord.totalReturnAmount);

        // Subtract from total staked
        if (Number(user.totalStaked) >= Number(returnRecord.originalAmount)) {
          user.totalStaked =
            Number(user.totalStaked) - Number(returnRecord.originalAmount);
        } else {
          user.totalStaked = 0; // Prevent negative values
        }

        // Add to total earnings (optional field)
        if (!user.totalEarnings) {
          user.totalEarnings = 0;
        }

        if (!user.todaysEarning) {
          user.todaysEarning = 0;
        }

        user.totalEarnings =
          Number(user.totalEarnings) +
          Number(returnRecord.profitAmount) -
          Number(returnRecord.handlingFee);

        user.todaysEarning =
          Number(user.todaysEarning) + netProfit

        await user.save();

        // Update stake status to completed
        await Stake.findByIdAndUpdate(returnRecord.stakeId, {
          status: "completed",
          completedAt: new Date(),
        });

        // Update return record status
        returnRecord.status = "completed";
        returnRecord.processedAt = new Date();
        await returnRecord.save();

        console.log(
          `✅ Processed matured stake for user ${returnRecord.userId}: +$${returnRecord.totalReturnAmount}`
        );
      } catch (recordError) {
        console.error(
          `Error processing stake return ${returnRecord._id}:`,
          recordError
        );
        // Continue with next record instead of stopping
      }
    }

    console.log(
      `✅ Successfully processed ${maturedReturns.length} matured stakes`
    );
    return { success: true, processed: maturedReturns.length };
  } catch (error) {
    console.error("❌ Error processing matured stakes:", error);
    return { success: false, error: error.message };
  }
};

export const getUserStakes = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    const stakes = await Stake.find({ userId })
      .populate("productId") // show full product details
      .sort({ createdAt: -1 }); // latest first

    return res.status(200).json({
      success: true,
      count: stakes.length,
      data: stakes,
    });
  } catch (error) {
    console.error("Get user stakes error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getAllStakes = async (req, res) => {
  try {
    const { status } = req.query; // optional filter ?status=active

    let filter = {};
    if (status) {
      filter.status = status;
    }

    const stakes = await Stake.find(filter)
      .populate("userId", "name email availableBalance")
      .populate("productId", "title income duration handlingFee status")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: stakes.length,
      data: stakes,
    });
  } catch (error) {
    console.error("Get all stakes error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
