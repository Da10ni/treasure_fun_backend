import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Admin from "../models/Admin.js";

// =============================================
// USER AUTHENTICATION MIDDLEWARE
// =============================================
export const authenticateUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access token required",
      });
    }

    // JWT token verify karo
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("🔐 User Auth - Decoded token:", decoded);
    // console.log("Decoded JWT payload:", decoded);
    console.log("decoded.userId:", decoded.userId);
    console.log("decoded.id:", decoded.id);
    console.log("Type of userId:", typeof decoded.userId);

    const userId = decoded.userId || decoded.id;
    console.log("Final userId:", userId);

    // Sirf User collection mein check karo
    const user = await User.findById(userId);

    if (!user) {
      console.log(`❌ User with ID ${userId} not found`);
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    // Active status check
    if (user.hasOwnProperty("isActive") && !user.isActive) {
      console.log(`❌ User account inactive: ${user.username}`);
      return res.status(401).json({
        success: false,
        message: "User account is inactive",
      });
    }

    // Request object mein user info attach karo
    req.userId = userId;
    req.user = user;
    req.userType = "user";

    console.log(`✅ USER authenticated: ${user.username} (ID: ${userId})`);
    console.log(
      `💰 User Wallet: ${user.walletBalance}, Tuft Wallet: ${user.tuftWalletBalance}`
    );

    next();
  } catch (error) {
    console.error("❌ User authentication error:", error);

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid token format",
      });
    }

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token expired, please login again",
      });
    }

    return res.status(500).json({
      success: false,
      message: "User authentication failed",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// =============================================
// ADMIN AUTHENTICATION MIDDLEWARE
// =============================================
export const authenticateAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Admin access token required",
      });
    }

    // JWT token verify karo
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("🔐 Admin Auth - Decoded token:", decoded);

    const adminId = decoded.userId || decoded.id;
    console.log("Admin Id in middleWare", adminId);

    // Sirf Admin collection mein check karo
    const admin = await Admin.findById(adminId);

    console.log("admin id check", adminId);

    if (!admin) {
      console.log(`❌ Admin with ID ${adminId} not found`);
      return res.status(401).json({
        success: false,
        message: "Admin not found",
      });
    }

    // Note: Admin schema mein isActive field nahi hai, so skip that check

    // Request object mein admin info attach karo
    req.userId = adminId;
    req.admin = admin;
    req.userType = "admin";

    console.log(`✅ ADMIN authenticated: ${admin.username} (ID: ${adminId})`);
    console.log(`📧 Admin Email: ${admin.email || "Not provided"}`);

    next();
  } catch (error) {
    console.error("❌ Admin authentication error:", error);

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid admin token format",
      });
    }

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Admin token expired, please login again",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Admin authentication failed",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};
