// 8. ROUTES (routes/depositRoutes.js)
// =============================================

import express from 'express';
import {
  createDepositController,
  getAllDepositsController,
  getDepositByIdController,
  getDepositsByUserIdController,
  updateDepositStatusController,
  deleteDepositController
} from '../controllers/depositController.js';
import uploadMiddleware from '../middleware/multer.js';

const router = express.Router();

// Create new deposit
router.post('/create', uploadMiddleware, createDepositController);

// Get all deposits
router.get('/', getAllDepositsController);

// Get deposit by ID
router.get('/:id', getDepositByIdController);

// Get deposits by user ID
router.get('/user/:userId', getDepositsByUserIdController);

// Update deposit status
router.patch('/:id/status', updateDepositStatusController);

// Delete deposit
router.delete('/:id', deleteDepositController);

export default router;