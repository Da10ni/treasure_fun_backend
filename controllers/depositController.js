import Deposit from '../models/deposit.model.js';
import { productModel as Product } from '../models/Product.js'; // Updated import
import User from '../models/User.js'; // Assuming you have a User model
import { uploadToCloudinary, deleteFromCloudinary } from '../services/cloudinaryService.js';

// =============================================
// CREATE NEW DEPOSIT (with file upload)
// =============================================
export const createDeposit = async (req, res) => {
  try {
    const {
      userId,
      productId,
      amount,
      referredByCode
    } = req.body;

    // Check if file is uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Deposit verification image is required'
      });
    }

    // Validate required fields
    if (!userId || !productId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: userId and productId are required'
      });
    }

    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    // Verify product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Validate amount is within product price range
    if (amount) {
      if (amount < product.priceRange.min || amount > product.priceRange.max) {
        return res.status(400).json({
          success: false,
          message: `Amount must be between ${product.priceRange.min} and ${product.priceRange.max}`
        });
      }
    }

    // Upload image to Cloudinary
    const uploadResult = await uploadToCloudinary(req.file, 'deposits');

    // Create new deposit
    const newDeposit = new Deposit({
      userId,
      productId,
      attachment: uploadResult.url, // Store Cloudinary URL
      amount: amount || product.priceRange.min, // Use minimum price if amount not provided
      referredByCode,
      status: 'pending' // Default status
    });

    // Save to database
    await newDeposit.save();

    // Get the created deposit with populated fields
    const createdDeposit = await Deposit.findById(newDeposit._id)
      .populate('userId', 'name email phone')
      .populate('productId', 'title image status priceRange income handlingFee');

    res.status(201).json({
      success: true,
      message: 'Deposit created successfully',
      data: createdDeposit
    });

  } catch (error) {
    console.error('Error creating deposit:', error);

    // Handle duplicate deposit (if you want to prevent duplicates)
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Duplicate deposit detected'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error creating deposit',
      error: error.message
    });
  }
};

// =============================================
// GET ALL DEPOSITS (with filters)
// =============================================
export const getDeposits = async (req, res) => {
  try {
    const {
      status,
      userId,
      productId,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      order = 'desc'
    } = req.query;

    // Build filter object
    const filter = {};
    if (status) filter.status = status;
    if (userId) filter.userId = userId;
    if (productId) filter.productId = productId;

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Sort order
    const sortOrder = order === 'asc' ? 1 : -1;

    // Get deposits with populated references
    const deposits = await Deposit.find(filter)
      .populate('userId', 'name email') // Adjust fields as per your User model
      .populate('productId', 'title image status priceRange income handlingFee') // Updated fields
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const totalDeposits = await Deposit.countDocuments(filter);
    const totalPages = Math.ceil(totalDeposits / limit);

    res.status(200).json({
      success: true,
      data: {
        deposits,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalDeposits,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Error fetching deposits:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching deposits',
      error: error.message
    });
  }
};

// =============================================
// GET SINGLE DEPOSIT BY ID
// =============================================
export const getDepositById = async (req, res) => {
  try {
    const { depositId } = req.params;

    const deposit = await Deposit.findById(depositId)
      .populate('userId', 'name email phone') // Adjust fields as needed
      .populate('productId', 'title image status priceRange income handlingFee'); // Updated fields

    if (!deposit) {
      return res.status(404).json({
        success: false,
        message: 'Deposit not found'
      });
    }

    res.status(200).json({
      success: true,
      data: deposit
    });

  } catch (error) {
    console.error('Error fetching deposit:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching deposit',
      error: error.message
    });
  }
};
export const approveDeposit = async (req, res) => {
  try {
    const { depositId } = req.params;
    const { approvedBy, notes } = req.body;

    // Find the deposit
    const deposit = await Deposit.findById(depositId);

    if (!deposit) {
      return res.status(404).json({
        success: false,
        message: 'Deposit not found'
      });
    }

    // Check if deposit is already processed
    if (deposit.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Deposit is already ${deposit.status}. Cannot approve.`
      });
    }

    // Update deposit status
    deposit.status = 'approved';
    deposit.approvedBy = approvedBy;
    deposit.approvedAt = new Date();
    deposit.notes = notes;

    await deposit.save();

    // Handle referral bonus
    try {
      // Find the user who made the deposit
      const currentUser = await User.findById(deposit.userId);

      if (currentUser && currentUser.referredByCode) {
        // Find the referrer by their referral code
        const referrer = await User.findByReferralCode(currentUser.referredByCode);

        if (referrer) {
          // Get referral percentage from referral model
          const referralSettings = await referralModel.findOne().sort({ createdAt: -1 }); // Latest referral settings

          if (referralSettings) {
            // Calculate bonus based on percentage from database
            const bonusPercentage = referralSettings.percentage / 100; // Convert percentage to decimal
            const bonusAmount = deposit.amount * bonusPercentage;

            console.log(`Using referral percentage: ${referralSettings.percentage}%`);
            console.log(`Deposit amount: ${deposit.amount}, Bonus amount: ${bonusAmount}`);

            // Update referrer's wallet balance
            referrer.tuftWalletBalance = (referrer.tuftWalletBalance || 0) + bonusAmount;
            await referrer.save();

            console.log(`Referral bonus of ${bonusAmount} (${referralSettings.percentage}%) added to user ${referrer.username}`);
          } else {
            console.log('No referral settings found, skipping bonus');
          }
        }
      }
    } catch (referralError) {
      console.error('Error processing referral bonus:', referralError);
      // Don't fail the entire deposit approval if referral bonus fails
    }

    // Populate the updated deposit for response
    const updatedDeposit = await Deposit.findById(depositId)
      .populate('userId', 'name email')
      .populate('productId', 'title image status priceRange income handlingFee');

    res.status(200).json({
      success: true,
      message: 'Deposit approved successfully',
      data: updatedDeposit
    });

  } catch (error) {
    console.error('Error approving deposit:', error);
    res.status(500).json({
      success: false,
      message: 'Error approving deposit',
      error: error.message
    });
  }
};
// =============================================
// REJECT DEPOSIT
// =============================================
export const rejectDeposit = async (req, res) => {
  try {
    const { depositId } = req.params;
    const { rejectedBy, reason } = req.body; // Reason for rejection

    // Find the deposit
    const deposit = await Deposit.findById(depositId);

    if (!deposit) {
      return res.status(404).json({
        success: false,
        message: 'Deposit not found'
      });
    }

    // Check if deposit is already processed
    if (deposit.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Deposit is already ${deposit.status}. Cannot reject.`
      });
    }

    // Update deposit status
    deposit.status = 'rejected';
    deposit.rejectedBy = rejectedBy;
    deposit.rejectedAt = new Date();
    deposit.rejectionReason = reason;

    await deposit.save();

    // Populate the updated deposit for response
    const updatedDeposit = await Deposit.findById(depositId)
      .populate('userId', 'name email')
      .populate('productId', 'title image status priceRange income handlingFee');

    res.status(200).json({
      success: true,
      message: 'Deposit rejected successfully',
      data: updatedDeposit
    });

  } catch (error) {
    console.error('Error rejecting deposit:', error);
    res.status(500).json({
      success: false,
      message: 'Error rejecting deposit',
      error: error.message
    });
  }
};

// =============================================
// UPDATE DEPOSIT DETAILS (Confirm Details)
// =============================================
export const updateDepositDetails = async (req, res) => {
  try {
    const { depositId } = req.params;
    const { amount, referredByCode } = req.body;

    // Find the deposit
    const deposit = await Deposit.findById(depositId);

    if (!deposit) {
      return res.status(404).json({
        success: false,
        message: 'Deposit not found'
      });
    }

    // Only allow updates if deposit is pending
    if (deposit.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Cannot update deposit details. Deposit is already processed.'
      });
    }

    // Handle new image upload if provided
    if (req.file) {
      // Upload new image to Cloudinary
      const uploadResult = await uploadToCloudinary(req.file, 'deposits');

      // Optional: Delete old image from Cloudinary (if you store public_id)
      // You might want to add a public_id field to your schema to track this

      deposit.attachment = uploadResult.url;
    }

    // Update allowed fields
    if (amount !== undefined) deposit.amount = amount;
    if (referredByCode !== undefined) deposit.referredByCode = referredByCode;

    await deposit.save();

    // Populate the updated deposit for response
    const updatedDeposit = await Deposit.findById(depositId)
      .populate('userId', 'name email')
      .populate('productId', 'title image status priceRange income handlingFee');

    res.status(200).json({
      success: true,
      message: 'Deposit details updated successfully',
      data: updatedDeposit
    });

  } catch (error) {
    console.error('Error updating deposit details:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating deposit details',
      error: error.message
    });
  }
};

// =============================================
// GET DEPOSITS BY USER (for user dashboard)
// =============================================
export const getUserDeposits = async (req, res) => {
  try {
    const { userId } = req.params;
    const { status, page = 1, limit = 10 } = req.query;

    // Build filter
    const filter = { userId };
    if (status) filter.status = status;

    // Pagination
    const skip = (page - 1) * limit;

    const deposits = await Deposit.find(filter)
      .populate('productId', 'title image status priceRange income handlingFee')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalDeposits = await Deposit.countDocuments(filter);
    const totalPages = Math.ceil(totalDeposits / limit);

    res.status(200).json({
      success: true,
      data: {
        deposits,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalDeposits,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Error fetching user deposits:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user deposits',
      error: error.message
    });
  }
};

// =============================================
// GET DEPOSIT STATISTICS
// =============================================
export const getDepositStats = async (req, res) => {
  try {
    const stats = await Deposit.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      }
    ]);

    // Format the stats
    const formattedStats = {
      pending: { count: 0, totalAmount: 0 },
      approved: { count: 0, totalAmount: 0 },
      rejected: { count: 0, totalAmount: 0 }
    };

    stats.forEach(stat => {
      if (formattedStats[stat._id]) {
        formattedStats[stat._id] = {
          count: stat.count,
          totalAmount: stat.totalAmount || 0
        };
      }
    });

    // Calculate totals
    const totalDeposits = stats.reduce((sum, stat) => sum + stat.count, 0);
    const totalAmount = stats.reduce((sum, stat) => sum + (stat.totalAmount || 0), 0);

    res.status(200).json({
      success: true,
      data: {
        ...formattedStats,
        totals: {
          totalDeposits,
          totalAmount
        }
      }
    });

  } catch (error) {
    console.error('Error fetching deposit stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching deposit statistics',
      error: error.message
    });
  }
};