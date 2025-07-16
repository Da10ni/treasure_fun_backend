import Stake from "../models/Stake.js";
import mongoose from "mongoose";

// Helper function to validate ObjectId
const validateObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

// Helper function to parse price string (e.g., "usdt302" -> {amount: 302, currency: "USDT"})
const parsePrice = (priceString) => {
  if (!priceString) return null;

  const match = priceString.match(/^([a-zA-Z]+)(\d+(?:\.\d+)?)$/);
  if (!match) return null;

  return {
    currency: match[1].toUpperCase(),
    amount: parseFloat(match[2]),
  };
};

// Create new stake
export const createStake = async (req, res) => {
  try {
    const {
      stakeId,
      contractAddress,
      owner,
      price,
      resaleProfit,
      chain,
      tokenId,
      timeZone,
      status,
      metadata,
    } = req.body;

    // Validation
    const errors = [];

    if (!contractAddress) {
      errors.push({
        field: "contractAddress",
        message: "Contract address is required",
      });
    } else if (!/^0x[a-fA-F0-9]{40}$/.test(contractAddress)) {
      errors.push({
        field: "contractAddress",
        message: "Invalid contract address format",
      });
    }

    if (!owner || owner.trim().length < 2) {
      errors.push({
        field: "owner",
        message: "Owner name is required (min 2 characters)",
      });
    }

    if (!tokenId) {
      errors.push({ field: "tokenId", message: "Token ID is required" });
    }

    if (!timeZone) {
      errors.push({ field: "timeZone", message: "Time zone is required" });
    }

    // Parse price if it's a string like "usdt302"
    let parsedPrice = price;
    if (typeof price === "string") {
      parsedPrice = parsePrice(price);
      if (!parsedPrice) {
        errors.push({
          field: "price",
          message: 'Invalid price format. Use format like "usdt302"',
        });
      }
    }

    // Parse resale profit if it's a string like "usdt0"
    let parsedResaleProfit = resaleProfit;
    if (typeof resaleProfit === "string") {
      parsedResaleProfit = parsePrice(resaleProfit);
      if (!parsedResaleProfit) {
        errors.push({
          field: "resaleProfit",
          message: 'Invalid resale profit format. Use format like "usdt0"',
        });
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors,
      });
    }

    // Check if stake ID already exists (if provided)
    if (stakeId) {
      const existingStake = await Stake.findByStakeId(stakeId);
      if (existingStake) {
        return res.status(409).json({
          success: false,
          message: "Stake ID already exists",
        });
      }
    }

    // Create new stake
    const newStake = new Stake({
      stakeId: stakeId || undefined, // Let pre-save middleware generate if not provided
      contractAddress: contractAddress.toLowerCase(),
      owner: owner.trim(),
      price: parsedPrice || { amount: 0, currency: "USDT" },
      resaleProfit: parsedResaleProfit || { amount: 0, currency: "USDT" },
      chain: chain || "Polygon",
      tokenId: tokenId.trim(),
      timeZone: timeZone.trim(),
      status: status || "active",
      createdBy: req.userId,
      metadata: metadata || {},
    });

    await newStake.save();

    res.status(201).json({
      success: true,
      message: "Stake created successfully",
      data: {
        stake: newStake.toJSON(),
      },
    });
  } catch (error) {
    console.error("Create stake error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      ...(process.env.NODE_ENV === "development" && { error: error.message }),
    });
  }
};

// Get all stakes with pagination and filtering
export const getAllStakes = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
    const skip = (page - 1) * limit;
    const sortBy = req.query.sortBy || "createdAt";
    const sortOrder = req.query.sortOrder === "asc" ? 1 : -1;

    // Build filter object
    let filter = {};

    if (req.query.chain) {
      filter.chain = req.query.chain;
    }

    if (req.query.status) {
      filter.status = req.query.status;
    }

    if (req.query.owner) {
      filter.owner = { $regex: req.query.owner, $options: "i" };
    }

    if (req.query.minPrice) {
      filter["price.amount"] = { $gte: parseFloat(req.query.minPrice) };
    }

    if (req.query.maxPrice) {
      filter["price.amount"] = {
        ...filter["price.amount"],
        $lte: parseFloat(req.query.maxPrice),
      };
    }

    // Build sort object
    const sortObj = {};
    sortObj[sortBy] = sortOrder;

    // Get total count
    const totalStakes = await Stake.countDocuments(filter);

    // Get stakes with pagination
    const stakes = await Stake.find(filter)
      .populate("createdBy", "username email")
      .sort(sortObj)
      .skip(skip)
      .limit(limit);

    const totalPages = Math.ceil(totalStakes / limit);

    res.status(200).json({
      success: true,
      message: "Stakes retrieved successfully",
      data: {
        stakes,
        pagination: {
          currentPage: page,
          totalPages,
          totalStakes,
          limit,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
        filter: req.query,
        sorting: {
          sortBy,
          sortOrder: sortOrder === 1 ? "asc" : "desc",
        },
      },
    });
  } catch (error) {
    console.error("Get all stakes error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      ...(process.env.NODE_ENV === "development" && { error: error.message }),
    });
  }
};

// Get stake by ID or Stake ID
export const getStakeById = async (req, res) => {
  try {
    const { id } = req.params;
    let stake;

    // Check if it's a MongoDB ObjectId or Stake ID
    if (validateObjectId(id)) {
      stake = await Stake.findById(id).populate("createdBy", "username email");
    } else {
      // Assume it's a stake ID like "Stake_2616314"
      stake = await Stake.findByStakeId(id).populate(
        "createdBy",
        "username email"
      );
    }

    if (!stake) {
      return res.status(404).json({
        success: false,
        message: "Stake not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Stake retrieved successfully",
      data: {
        stake: stake.toJSON(),
      },
    });
  } catch (error) {
    console.error("Get stake by ID error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      ...(process.env.NODE_ENV === "development" && { error: error.message }),
    });
  }
};

// Update stake by ID
export const updateStakeById = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      contractAddress,
      owner,
      price,
      resaleProfit,
      chain,
      tokenId,
      timeZone,
      status,
      metadata,
    } = req.body;

    let stake;

    // Find stake by MongoDB ID or Stake ID
    if (validateObjectId(id)) {
      stake = await Stake.findById(id);
    } else {
      stake = await Stake.findByStakeId(id);
    }

    if (!stake) {
      return res.status(404).json({
        success: false,
        message: "Stake not found",
      });
    }

    // Check ownership (user can only update their own stakes)
    if (stake.createdBy.toString() !== req.userId) {
      return res.status(403).json({
        success: false,
        message: "Access denied: You can only update your own stakes",
      });
    }

    // Build update object
    const updateData = {};

    if (contractAddress !== undefined) {
      updateData.contractAddress = contractAddress.toLowerCase();
    }

    if (owner !== undefined) {
      updateData.owner = owner.trim();
    }

    if (price !== undefined) {
      if (typeof price === "string") {
        const parsedPrice = parsePrice(price);
        if (parsedPrice) {
          updateData.price = parsedPrice;
        }
      } else {
        updateData.price = price;
      }
    }

    if (resaleProfit !== undefined) {
      if (typeof resaleProfit === "string") {
        const parsedResaleProfit = parsePrice(resaleProfit);
        if (parsedResaleProfit) {
          updateData.resaleProfit = parsedResaleProfit;
        }
      } else {
        updateData.resaleProfit = resaleProfit;
      }
    }

    if (chain !== undefined) updateData.chain = chain;
    if (tokenId !== undefined) updateData.tokenId = tokenId.trim();
    if (timeZone !== undefined) updateData.timeZone = timeZone.trim();
    if (status !== undefined) updateData.status = status;
    if (metadata !== undefined) updateData.metadata = metadata;

    // Update stake
    const updatedStake = await Stake.findByIdAndUpdate(stake._id, updateData, {
      new: true,
      runValidators: true,
    }).populate("createdBy", "username email");

    res.status(200).json({
      success: true,
      message: "Stake updated successfully",
      data: {
        stake: updatedStake.toJSON(),
      },
    });
  } catch (error) {
    console.error("Update stake error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      ...(process.env.NODE_ENV === "development" && { error: error.message }),
    });
  }
};

// Delete stake by ID
export const deleteStakeById = async (req, res) => {
  try {
    const { id } = req.params;
    let stake;

    // Find stake by MongoDB ID or Stake ID
    if (validateObjectId(id)) {
      stake = await Stake.findById(id);
    } else {
      stake = await Stake.findByStakeId(id);
    }

    if (!stake) {
      return res.status(404).json({
        success: false,
        message: "Stake not found",
      });
    }

    // Check ownership (user can only delete their own stakes)
    if (stake.createdBy.toString() !== req.userId) {
      return res.status(403).json({
        success: false,
        message: "Access denied: You can only delete your own stakes",
      });
    }

    await Stake.findByIdAndDelete(stake._id);

    res.status(200).json({
      success: true,
      message: "Stake deleted successfully",
    });
  } catch (error) {
    console.error("Delete stake error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      ...(process.env.NODE_ENV === "development" && { error: error.message }),
    });
  }
};

// Get stakes by user
export const getStakesByUser = async (req, res) => {
  try {
    const userId = req.params.userId || req.userId;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
    const skip = (page - 1) * limit;

    // Build filter
    const filter = { createdBy: userId };

    if (req.query.status) {
      filter.status = req.query.status;
    }

    // Get total count
    const totalStakes = await Stake.countDocuments(filter);

    // Get user's stakes
    const stakes = await Stake.find(filter)
      .populate("createdBy", "username email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalPages = Math.ceil(totalStakes / limit);

    res.status(200).json({
      success: true,
      message: "User stakes retrieved successfully",
      data: {
        stakes,
        pagination: {
          currentPage: page,
          totalPages,
          totalStakes,
          limit,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      },
    });
  } catch (error) {
    console.error("Get stakes by user error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      ...(process.env.NODE_ENV === "development" && { error: error.message }),
    });
  }
};

// Get stake statistics
export const getStakeStats = async (req, res) => {
  try {
    const totalStakes = await Stake.countDocuments();
    const activeStakes = await Stake.countDocuments({ status: "active" });
    const soldStakes = await Stake.countDocuments({ status: "sold" });

    // Stakes by chain
    const stakesByChain = await Stake.aggregate([
      {
        $group: {
          _id: "$chain",
          count: { $sum: 1 },
          totalValue: { $sum: "$price.amount" },
          totalProfit: { $sum: "$resaleProfit.amount" },
        },
      },
      {
        $sort: { count: -1 },
      },
    ]);

    // Recent stakes (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentStakes = await Stake.countDocuments({
      createdAt: { $gte: sevenDaysAgo },
    });

    // Total value and profit
    const valueStats = await Stake.aggregate([
      {
        $group: {
          _id: null,
          totalValue: { $sum: "$price.amount" },
          totalProfit: { $sum: "$resaleProfit.amount" },
          averagePrice: { $avg: "$price.amount" },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      message: "Stake statistics retrieved successfully",
      data: {
        overview: {
          totalStakes,
          activeStakes,
          soldStakes,
          recentStakes,
        },
        chains: stakesByChain,
        financial: valueStats[0] || {
          totalValue: 0,
          totalProfit: 0,
          averagePrice: 0,
        },
      },
    });
  } catch (error) {
    console.error("Get stake stats error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      ...(process.env.NODE_ENV === "development" && { error: error.message }),
    });
  }
};
