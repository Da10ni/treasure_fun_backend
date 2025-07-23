import User from "../models/User.js"
import { Withdrawal } from "../models/withdrawal.model.js";

// User withdrawal request banane ke liye
const createWithdrawalRequest = async (req, res) => {
    try {
        const { amount, walletId } = req.body;
        const {id: userId} = req.params; // User ID params se aa rahi hai

        // Validate amount
        if (!amount || amount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Valid amount is required'
            });
        }

        // Check if user exists
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Check if walletId matches user's wallet
        if (!user.walletId || user.walletId.toString() !== walletId) {
            return res.status(400).json({
                success: false,
                message: 'Invalid wallet ID for this user'
            });
        }

        // Check user wallet balance
        const userWalletBalance = user.walletBalance || 0;
        
        // Check if user has 0 balance
        if (userWalletBalance <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Insufficient balance. Your wallet balance is 0. Please add funds to your wallet first.'
            });
        }

        // Check if user has enough balance for withdrawal
        if (amount > userWalletBalance) {
            return res.status(400).json({
                success: false,
                message: `Insufficient balance. Your current balance is ${userWalletBalance} and you are trying to withdraw ${amount}. Please enter a smaller amount.`
            });
        }

        // Create withdrawal request
        const withdrawal = new Withdrawal({
            userId,
            amount,
            walletId,
            status: 'processing'
        });

        await withdrawal.save();

        // Populate user details
        await withdrawal.populate([
            { path: 'userId', select: 'name email walletBalance walletId' }
        ]);

        res.status(201).json({
            success: true,
            message: 'Withdrawal request submitted successfully',
            data: withdrawal
        });

    } catch (error) {
        console.error('Create withdrawal error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error occurred',
            error: error.message
        });
    }
};

// Admin ke liye - Sare withdrawal requests get karne ke liye
const getAllWithdrawalRequests = async (req, res) => {
    try {
        const { status, page = 1, limit = 10 } = req.query;
        
        // Build query
        let query = {};
        if (status) {
            query.status = status;
        }

        // Pagination
        const skip = (page - 1) * limit;

        const withdrawals = await Withdrawal.find(query)
            .populate('userId', 'name email walletId')
            .sort({ requestDate: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Withdrawal.countDocuments(query);

        res.status(200).json({
            success: true,
            message: 'Withdrawal requests retrieved successfully',
            data: {
                withdrawals,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(total / limit),
                    totalItems: total,
                    itemsPerPage: parseInt(limit)
                }
            }
        });

    } catch (error) {
        console.error('Get withdrawals error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error occurred',
            error: error.message
        });
    }
};

// Admin ke liye - Withdrawal approve karne ke liye
const approveWithdrawal = async (req, res) => {
    try {
        const { id } = req.params;

        const withdrawal = await Withdrawal.findById(id).populate('userId');
        
        if (!withdrawal) {
            return res.status(404).json({
                success: false,
                message: 'Withdrawal request not found'
            });
        }

        if (withdrawal.status !== 'processing') {
            return res.status(400).json({
                success: false,
                message: 'Withdrawal request is already processed'
            });
        }

        // Get user and check current balance
        const user = await User.findById(withdrawal.userId._id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Check if user still has enough balance
        const currentBalance = user.walletBalance || 0;
        if (currentBalance < withdrawal.amount) {
            return res.status(400).json({
                success: false,
                message: `Cannot approve withdrawal. User's current balance (${currentBalance}) is less than withdrawal amount (${withdrawal.amount})`
            });
        }

        // Deduct amount from user's wallet balance & increment sell count
        const newBalance = currentBalance - withdrawal.amount;
        const updatedUser = await User.findByIdAndUpdate(
            withdrawal.userId._id, 
            {
                walletBalance: newBalance,
                $inc: { sell: 1 } // 🔥 INCREMENT USER'S SELL COUNT
            },
            { new: true }
        );

        console.log(`📊 User sell count incremented to: ${updatedUser.sell}`);

        // Update withdrawal status
        withdrawal.status = 'completed';
        withdrawal.processedDate = new Date();
        await withdrawal.save();

        // Populate details for response
        await withdrawal.populate([
            { path: 'userId', select: 'name email walletBalance walletId sell' } // sell field bhi include kiya
        ]);

        res.status(200).json({
            success: true,
            message: `Withdrawal approved successfully. ${withdrawal.amount} deducted from user's wallet. New balance: ${newBalance}. Sell count: ${updatedUser.sell}`,
            data: withdrawal
        });

    } catch (error) {
        console.error('Approve withdrawal error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error occurred',
            error: error.message
        });
    }
};

// Admin ke liye - Withdrawal reject karne ke liye
const rejectWithdrawal = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        const withdrawal = await Withdrawal.findById(id);
        
        if (!withdrawal) {
            return res.status(404).json({
                success: false,
                message: 'Withdrawal request not found'
            });
        }

        if (withdrawal.status !== 'processing') {
            return res.status(400).json({
                success: false,
                message: 'Withdrawal request is already processed'
            });
        }

        // Update withdrawal status
        withdrawal.status = 'rejected';
        withdrawal.processedDate = new Date();
        withdrawal.rejectionReason = reason || 'No reason provided';
        await withdrawal.save();

        // Populate details for response
        await withdrawal.populate([
            { path: 'userId', select: 'name email walletId' }
        ]);

        res.status(200).json({
            success: true,
            message: 'Withdrawal rejected successfully',
            data: withdrawal
        });

    } catch (error) {
        console.error('Reject withdrawal error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error occurred',
            error: error.message
        });
    }
};

// User ke liye - Apne withdrawal requests dekhne ke liye
const getUserWithdrawals = async (req, res) => {
    try {
        const userId = req.user.id;
        const { status, page = 1, limit = 10 } = req.query;

        // Build query
        let query = { userId };
        if (status) {
            query.status = status;
        }

        // Pagination
        const skip = (page - 1) * limit;

        const withdrawals = await Withdrawal.find(query)
            .sort({ requestDate: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Withdrawal.countDocuments(query);

        res.status(200).json({
            success: true,
            message: 'User withdrawal requests retrieved successfully',
            data: {
                withdrawals,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(total / limit),
                    totalItems: total,
                    itemsPerPage: parseInt(limit)
                }
            }
        });

    } catch (error) {
        console.error('Get user withdrawals error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error occurred',
            error: error.message
        });
    }
};

// Single withdrawal details get karne ke liye
const getWithdrawalDetails = async (req, res) => {
    try {
        const { id } = req.params;

        const withdrawal = await Withdrawal.findById(id)
            .populate('userId', 'name email walletId');

        if (!withdrawal) {
            return res.status(404).json({
                success: false,
                message: 'Withdrawal request not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Withdrawal details retrieved successfully',
            data: withdrawal
        });

    } catch (error) {
        console.error('Get withdrawal details error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error occurred',
            error: error.message
        });
    }
};

export {
    createWithdrawalRequest,
    getAllWithdrawalRequests,
    approveWithdrawal,
    rejectWithdrawal,
    getUserWithdrawals,
    getWithdrawalDetails
};