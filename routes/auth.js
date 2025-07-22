import express from 'express';
import {
  generateReferralCodeForEmail,
  signup,
  login,
  getProfile,
  logout,
  updateProfile,
  validateReferralCode,      
  getUserReferrals, 
  getAllUsers,
  toggleUserStatus,
  checkAuth,
  getMyDeposits
} from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.js'; 

const router = express.Router();

// Existing routes
router.post('/generate-code', generateReferralCodeForEmail);
router.get('/check-auth', authenticateToken, checkAuth);
router.post('/signup', signup);
router.post('/login', login);
router.get('/profile', authenticateToken, getProfile);
router.post('/logout', authenticateToken, logout);
router.put('/profile', authenticateToken, updateProfile);
router.get('/deposits/:id',  getMyDeposits);

// NEW: Referral system routes
router.get('/referral/validate/:code', validateReferralCode);
router.get('/referrals', authenticateToken, getUserReferrals);
router.get('/users', getAllUsers)
router.patch('/users/:userId/toggle-status', authenticateToken, toggleUserStatus);

export default router;