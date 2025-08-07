import express from 'express';
import multer from 'multer';
import {
  createDeposit,
  getDeposits,
  getDepositById,
  approveDeposit,
  rejectDeposit,
  updateDepositDetails,
  getUserDeposits,
  getDepositStats
} from '../controllers/depositController.js';
import { authenticateAdmin, authenticateUser } from '../middleware/auth.js';

const router = express.Router();

// =============================================
// MULTER CONFIGURATION
// =============================================
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Check file type
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// =============================================
// USER DEPOSIT ROUTES (authenticateUser)
// =============================================

// Create new deposit (with file upload) - USER ONLY
// POST /api/deposits/create
router.post('/create', authenticateUser, upload.single('attachment'), createDeposit);

// Get deposits by user ID - USER CAN ACCESS (with security check in controller)
// GET /api/deposits/user/:userId
router.get('/user/:userId', authenticateUser, getUserDeposits);

// Update deposit details (pending deposits only) - USER ONLY
// PUT /api/deposits/:depositId/details
router.put('/:depositId/details', authenticateUser, upload.single('attachment'), updateDepositDetails);

// =============================================
// ADMIN DEPOSIT ROUTES (authenticateAdmin)  
// =============================================

// Get deposit statistics - ADMIN ONLY
// GET /api/deposits/stats
router.get('/stats', authenticateAdmin, getDepositStats);

// Get all deposits (with filters and pagination) - ADMIN ONLY
// GET /api/deposits?status=pending&page=1&limit=10
router.get('/', authenticateAdmin, getDeposits);

// Get single deposit by ID - ADMIN ONLY
// GET /api/deposits/:depositId
router.get('/:depositId', authenticateAdmin, getDepositById);

// Approve deposit - ADMIN ONLY
// PUT /api/deposits/:depositId/approve
router.put('/:depositId/approve', authenticateAdmin, approveDeposit);

// Reject deposit - ADMIN ONLY
// PUT /api/deposits/:depositId/reject
router.put('/:depositId/reject', authenticateAdmin, rejectDeposit);

export default router;