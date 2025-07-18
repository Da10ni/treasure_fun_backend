import express from 'express';
import {
    createWithdrawalRequest,
    getAllWithdrawalRequests,
    approveWithdrawal,
    rejectWithdrawal,
    getUserWithdrawals,
    getWithdrawalDetails
} from '../controllers/withdrawalController.js';

// Middleware imports (adjust path according to your structure)
import { authenticateToken } from '../middleware/auth.js'

const router = express.Router();

// User Routes
// POST /api/withdrawals - User withdrawal request create karna
router.post('/create-withdrawal/:id', createWithdrawalRequest);

// GET /api/withdrawals/my - User apne withdrawal requests dekhna
router.get('/my', getUserWithdrawals);

// GET /api/withdrawals/:id - Single withdrawal details dekhna
router.get('/:id', getWithdrawalDetails);

// Admin Routes
// GET /api/withdrawals - Admin sare withdrawal requests dekhna
router.get('/', getAllWithdrawalRequests);

// PUT /api/withdrawals/:id/approve - Admin withdrawal approve karna
router.put('/:id/approve', approveWithdrawal);

// PUT /api/withdrawals/:id/reject - Admin withdrawal reject karna
router.put('/:id/reject', rejectWithdrawal);

export default router;