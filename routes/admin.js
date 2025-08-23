// import { Router } from "express";
// import {
//     getActiveUsers,
//     getProfile,
//     login,
//     logout,
//     signup,
//     updateProfile
// } from "../controllers/adminController.js";
// import { authenticateAdmin } from "../middleware/auth.js";
// import { checkAuth } from "../controllers/authController.js";

// const routes = Router();

// // =============================================
// // PUBLIC ROUTES (No Authentication Required)
// // =============================================
// routes.route("/register").post(signup);    // Admin signup - public
// routes.route("/login").post(login);        // Admin login - public
// routes.get('/check-admin', authenticateAdmin, checkAuth);

// // =============================================
// // ADMIN-ONLY ROUTES (authenticateAdmin)
// // =============================================
// routes.route("/logout").post(authenticateAdmin, logout);                    // Admin logout
// routes.route("/getactiveuser").get(getActiveUsers);      // Admin viewing user data
// routes.route("/update/:id").post(authenticateAdmin, updateProfile);         // Admin update own profile
// routes.route("/:id").get(authenticateAdmin, getProfile);                   // Admin get own profile

// // =============================================
// // ADMIN ROUTES THAT MIGHT ACCESS USER DATA
// // =============================================
// // Note: getActiveUsers - Admin wants to see active users, so Admin middleware is correct

// export default routes;

import { Router } from "express";
import {
  getActiveUsers,
  getProfile,
  login,
  logout,
  updateProfile,
  generateAuthenticatorQR,
  verifyAndEnableTotp,
  updateNetworkImages,
  getNetworkImages,
  deleteNetworkImages,
} from "../controllers/adminController.js";
import { authenticateAdmin } from "../middleware/auth.js";
import { checkAuth } from "../controllers/authController.js";
import multer from "multer";

// Configure multer with better options
const storage = multer.memoryStorage();
const upload = multer({ storage });
const routes = Router();

// =============================================
// PUBLIC ROUTES (No Authentication Required)
// =============================================
routes.route("/login").post(login); // Admin login - public
routes.route("/generate-qr").post(generateAuthenticatorQR); // Generate QR code for Google Authenticator
routes.route("/verify-totp").post(verifyAndEnableTotp); // Verify and enable TOTP
routes.get("/check-admin", authenticateAdmin, checkAuth);

// =============================================
// ADMIN-ONLY ROUTES (authenticateAdmin)
// =============================================
routes.route("/logout").post(authenticateAdmin, logout); // Admin logout
routes.route("/getactiveuser").get(getActiveUsers); // Admin viewing user data
routes.route("/update/:id").post(authenticateAdmin, updateProfile); // Admin update own profile
// Admin get own profile
routes.post(
  "/networks/update",
  authenticateAdmin,
  upload.fields([
    { name: "bep20Img", maxCount: 1 },
    { name: "trc20Img", maxCount: 1 },
  ]),
  updateNetworkImages
);
// routes.route("/network-images").get(authenticateAdmin, getNetworkImages);
// routes.post("/networks/update", authenticateAdmin, updateNetworkImages);
routes.get("/networks", authenticateAdmin, getNetworkImages);
routes
  .route("/networks/clear")
  .delete(authenticateAdmin, deleteNetworkImages);
routes.route("/:id").get(authenticateAdmin, getProfile);
export default routes;
