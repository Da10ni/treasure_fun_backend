// 7. DEPOSIT CONTROLLER (controllers/depositController.js)
// =============================================

import {
  createDeposit,
  getAllDeposits,
  getDepositById,
  getDepositsByUserId,
  updateDepositStatus,
  deleteDeposit
} from '../services/depositService.js';

// Create new deposit
export const createDepositController = async (req, res) => {
  try {
    const { userId, productId, amount } = req.body;
    
    // Validate required fields
    if (!userId || !productId) {
      return res.status(400).json({
        message: 'User ID and Product ID are required',
        success: false
      });
    }
    
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        message: 'Attachment is required',
        success: false
      });
    }
    
    const depositData = {
      userId,
      productId,
      amount: amount || 0
    };
    
    const deposit = await createDeposit(depositData, req.file);
    
    res.status(201).json({
      message: 'Deposit created successfully',
      success: true,
      data: deposit
    });
    
  } catch (error) {
    res.status(500).json({
      message: error.message,
      success: false
    });
  }
};

// Get all deposits
export const getAllDepositsController = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    
    const result = await getAllDeposits(page, limit);
    
    res.status(200).json({
      message: 'Deposits fetched successfully',
      success: true,
      data: result.deposits,
      pagination: result.pagination
    });
    
  } catch (error) {
    res.status(500).json({
      message: error.message,
      success: false
    });
  }
};

// Get deposit by ID
export const getDepositByIdController = async (req, res) => {
  try {
    const { id } = req.params;
    
    const deposit = await getDepositById(id);
    
    res.status(200).json({
      message: 'Deposit fetched successfully',
      success: true,
      data: deposit
    });
    
  } catch (error) {
    res.status(404).json({
      message: error.message,
      success: false
    });
  }
};

// Get deposits by user ID
export const getDepositsByUserIdController = async (req, res) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    
    const result = await getDepositsByUserId(userId, page, limit);
    
    res.status(200).json({
      message: 'User deposits fetched successfully',
      success: true,
      data: result.deposits,
      pagination: result.pagination
    });
    
  } catch (error) {
    res.status(500).json({
      message: error.message,
      success: false
    });
  }
};

// Update deposit status
export const updateDepositStatusController = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        message: 'Invalid status. Must be pending, approved, or rejected',
        success: false
      });
    }
    
    const deposit = await updateDepositStatus(id, status);
    
    res.status(200).json({
      message: 'Deposit status updated successfully',
      success: true,
      data: deposit
    });
    
  } catch (error) {
    res.status(500).json({
      message: error.message,
      success: false
    });
  }
};

// Delete deposit
export const deleteDepositController = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await deleteDeposit(id);
    
    res.status(200).json({
      message: result.message,
      success: true
    });
    
  } catch (error) {
    res.status(500).json({
      message: error.message,
      success: false
    });
  }
};