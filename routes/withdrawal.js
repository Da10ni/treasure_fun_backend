import express from 'express';
import {
    createWithdrawalRequest,
    getAllWithdrawalRequests,
    approveWithdrawal,
    rejectWithdrawal,
    getUserWithdrawals,
    getWithdrawalDetails
} from '../controllers/withdrawalController.js';
import { authenticateAdmin, authenticateUser } from '../middleware/auth.js';

const router = express.Router();

// =============================================
// USER WITHDRAWAL ROUTES (authenticateUser)
// =============================================

// Create withdrawal request - USER ONLY
// POST /api/withdrawals/create-withdrawal/:id
router.post('/create-withdrawal/:id', authenticateUser, createWithdrawalRequest);

// Get user's own withdrawal requests - USER ONLY
// GET /api/withdrawals/my
router.get('/my', authenticateUser, getUserWithdrawals);

// =============================================
// ADMIN WITHDRAWAL ROUTES (authenticateAdmin)
// =============================================

// Get all withdrawal requests - ADMIN ONLY
// GET /api/withdrawals
router.get('/', authenticateAdmin, getAllWithdrawalRequests);

// Approve withdrawal - ADMIN ONLY
// PUT /api/withdrawals/:id/approve
router.put('/:id/approve', authenticateAdmin, approveWithdrawal);

// Reject withdrawal - ADMIN ONLY
// PUT /api/withdrawals/:id/reject
router.put('/:id/reject',authenticateAdmin, rejectWithdrawal);

// =============================================
// MIXED ACCESS ROUTES (Can be accessed by both)
// =============================================

// Get single withdrawal details - USER (own) or ADMIN (any)
// GET /api/withdrawals/:id
// Note: Controller should check if user is accessing their own withdrawal
router.get('/:id', authenticateAdmin, getWithdrawalDetails);

// Alternative: If you want admin to also access withdrawal details
// You can create separate routes or handle in controller based on req.userType

export default router;