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
import { authenticateUser, authenticateAdmin } from '../middleware/auth.js'; 

const router = express.Router();

// =============================================
// PUBLIC ROUTES (No Authentication Required)
// =============================================
router.post('/generate-code', generateReferralCodeForEmail);        // Public - Email ke liye code generate
router.post('/signup', signup);                                     // Public - User registration  
router.post('/login', login);                                       // Public - User login
router.get('/referral/validate/:code', validateReferralCode);       // Public - Referral code validate

// =============================================
// USER-ONLY ROUTES (authenticateUser)
// =============================================
router.get('/check-auth', authenticateUser, checkAuth);             // User auth check
router.get('/profile', authenticateUser, getProfile);               // User ka apna profile
router.post('/logout', authenticateUser, logout);                   // User logout
router.put('/profile', authenticateUser, updateProfile);            // User apna profile update
router.get('/deposits/:id', authenticateUser, getMyDeposits);       // User ke deposits (ID should match token user)
router.get('/referrals', authenticateUser, getUserReferrals);       // User ke referrals

// =============================================
// ADMIN-ONLY ROUTES (authenticateAdmin)  
// =============================================
router.get('/users', authenticateAdmin, getAllUsers);               // Admin - All users list
router.patch('/users/:userId/toggle-status', authenticateAdmin, toggleUserStatus);  // Admin - Toggle user status

export default router;