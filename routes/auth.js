import express from 'express';
import {
  generateReferralCodeForEmail,
  signup,
  login,
  getProfile,
  logout,
  updateProfile,
  validateReferralCode,      
  getUserReferrals          
} from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.js'; 

const router = express.Router();

// Existing routes
router.post('/generate-code', generateReferralCodeForEmail);
router.post('/signup', signup);
router.post('/login', login);
router.get('/profile', authenticateToken, getProfile);
router.post('/logout', authenticateToken, logout);
router.put('/profile', authenticateToken, updateProfile);

// NEW: Referral system routes
router.get('/referral/validate/:code', validateReferralCode);
router.get('/referrals', authenticateToken, getUserReferrals);

export default router;