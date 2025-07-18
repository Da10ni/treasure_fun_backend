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
// DEPOSIT ROUTES
// =============================================

// Create new deposit (with file upload)
// POST /api/deposits
router.post('/create', upload.single('file'), createDeposit);

// Get all deposits (with filters and pagination)
// GET /api/deposits?status=pending&page=1&limit=10
router.get('/', getDeposits);

// Get deposit statistics
// GET /api/deposits/stats
router.get('/stats', getDepositStats);

// Get single deposit by ID
// GET /api/deposits/:depositId
router.get('/:depositId', getDepositById);

// Get deposits by user ID
// GET /api/deposits/user/:userId
router.get('/user/:userId', getUserDeposits);

// Approve deposit
// PUT /api/deposits/:depositId/approve
router.put('/:depositId/approve', approveDeposit);

// Reject deposit
// PUT /api/deposits/:depositId/reject
router.put('/:depositId/reject', rejectDeposit);

// Update deposit details (confirm details) - with optional file upload
// PUT /api/deposits/:depositId/details
router.put('/:depositId/details', upload.single('attachment'), updateDepositDetails);

export default router;
