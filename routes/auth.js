import express from "express";
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
  getMyDeposits,
  sendPasswordResetCode,
  verifyResetCode,
  resetPassword,
  changePassword,
  checkAndUnfreezeUsers,
  upgradeLevels,
  handelReserve,
  handelReserveUser,
  handelReservestatus,
  checkUserFreezeStatusEnhanced,
  handleRedeem,
  getTodaysEarning,
  getNetworkImages,
} from "../controllers/authController.js";
import { authenticateUser, authenticateAdmin } from "../middleware/auth.js";
import { handleStake } from "../controllers/stake.controller.js";

const router = express.Router();

// =============================================
// PUBLIC ROUTES (No Authentication Required)
// =============================================
router.post("/generate-code", generateReferralCodeForEmail); // Public - Email ke liye code generate
router.post("/signup", signup); // Public - User registration
router.post("/login", login); // Public - User login
router.get("/referral/validate/:code", validateReferralCode); // Public - Referral code validate

// Password Reset Routes (Public)
router.post("/password/forgot", sendPasswordResetCode); // Public - Send password reset code
router.post("/password/verify-code", verifyResetCode); // Public - Verify reset code (optional)
router.post("/password/reset", resetPassword);

// 🔥 UPDATED: Enhanced freeze status routes
router.get("/freeze-status", authenticateUser, checkUserFreezeStatusEnhanced); // User's own status
router.get(
  "/freeze-status/:userId",
  authenticateUser,
  checkUserFreezeStatusEnhanced
); // Specific user

router.post("/admin/unfreeze-expired", authenticateUser, async (req, res) => {
  try {
    const unfreezeCount = await checkAndUnfreezeUsers();
    res.status(200).json({
      success: true,
      message: `Successfully unfroze ${unfreezeCount} users`,
      unfrozeCount: unfreezeCount,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to unfreeze users",
      error: error.message,
    });
  }
});

// =============================================
// USER-ONLY ROUTES (authenticateUser)
// =============================================
router.get("/check-auth", authenticateUser, checkAuth); // User auth check
router.get("/profile", authenticateUser, getProfile); // User ka apna profile
router.post("/logout", authenticateUser, logout); // User logout
router.put("/profile", authenticateUser, updateProfile); // User apna profile update
router.get("/deposits/:id", authenticateUser, getMyDeposits); // User ke deposits (ID should match token user)
router.get("/referrals", authenticateUser, getUserReferrals); // User ke referrals
router.post("/upgrade-levels", authenticateUser, upgradeLevels);
router.post("/reserve", authenticateUser, handelReserve);
router.get("/reserve-status/:userId", authenticateUser, handelReservestatus);
router.get("/user/:userId/reserves", authenticateUser, handelReserveUser);
router.post("/redeem", authenticateUser, handleRedeem);
// Password Change Route (Authenticated)
router.post("/password/change", authenticateUser, changePassword); // User - Change password
router.get("/today-earnings/:userId", authenticateUser, getTodaysEarning);
router.get('/networks', authenticateUser, getNetworkImages);

router.post('/stakes/create', authenticateUser, handleStake);

// =============================================
// ADMIN-ONLY ROUTES (authenticateAdmin)
// =============================================
router.get("/users", authenticateAdmin, getAllUsers); // Admin - All users list
router.patch(
  "/users/:userId/toggle-status",
  authenticateAdmin,
  toggleUserStatus
); // Admin - Toggle user status

export default router;
