// =============================================
// 6. DEPOSIT SERVICE (services/depositService.js)
// =============================================

import Deposit from '../models/deposit.model.js';
import { uploadToCloudinary, deleteFromCloudinary } from './cloudinaryService.js';

// Create new deposit
export const createDeposit = async (depositData, file) => {
  try {
    // Upload file to Cloudinary
    const uploadResult = await uploadToCloudinary(file, 'deposits');
    
    // Create deposit with Cloudinary URLs
    const deposit = new Deposit({
      ...depositData,
      attachment: {
        url: uploadResult.url,
        public_id: uploadResult.public_id
      }
    });
    
    const savedDeposit = await deposit.save();
    
    // Populate user and product details
    const populatedDeposit = await Deposit.findById(savedDeposit._id)
      .populate('userId', 'name email')
      .populate('productId', 'name price');
    
    return populatedDeposit;
  } catch (error) {
    throw new Error(`Error creating deposit: ${error.message}`);
  }
};

// Get all deposits
export const getAllDeposits = async (page = 1, limit = 10) => {
  try {
    const skip = (page - 1) * limit;
    
    const deposits = await Deposit.find()
      .populate('userId', 'name email')
      .populate('productId', 'name price')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Deposit.countDocuments();
    
    return {
      deposits,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalDeposits: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    };
  } catch (error) {
    throw new Error(`Error fetching deposits: ${error.message}`);
  }
};

// Get deposit by ID
export const getDepositById = async (depositId) => {
  try {
    const deposit = await Deposit.findById(depositId)
      .populate('userId', 'name email')
      .populate('productId', 'name price');
    
    if (!deposit) {
      throw new Error('Deposit not found');
    }
    
    return deposit;
  } catch (error) {
    throw new Error(`Error fetching deposit: ${error.message}`);
  }
};

// Get deposits by user ID
export const getDepositsByUserId = async (userId, page = 1, limit = 10) => {
  try {
    const skip = (page - 1) * limit;
    
    const deposits = await Deposit.find({ userId })
      .populate('productId', 'name price')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Deposit.countDocuments({ userId });
    
    return {
      deposits,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalDeposits: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    };
  } catch (error) {
    throw new Error(`Error fetching user deposits: ${error.message}`);
  }
};

// Update deposit status
export const updateDepositStatus = async (depositId, status) => {
  try {
    const deposit = await Deposit.findByIdAndUpdate(
      depositId,
      { status, updatedAt: Date.now() },
      { new: true }
    ).populate('userId', 'name email')
     .populate('productId', 'name price');
    
    if (!deposit) {
      throw new Error('Deposit not found');
    }
    
    return deposit;
  } catch (error) {
    throw new Error(`Error updating deposit status: ${error.message}`);
  }
};

// Delete deposit
export const deleteDeposit = async (depositId) => {
  try {
    const deposit = await Deposit.findById(depositId);
    
    if (!deposit) {
      throw new Error('Deposit not found');
    }
    
    // Delete file from Cloudinary
    if (deposit.attachment.public_id) {
      await deleteFromCloudinary(deposit.attachment.public_id);
    }
    
    await Deposit.findByIdAndDelete(depositId);
    
    return { message: 'Deposit deleted successfully' };
  } catch (error) {
    throw new Error(`Error deleting deposit: ${error.message}`);
  }
};