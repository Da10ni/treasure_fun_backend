import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Admin from "../models/Admin.js"; // Admin model import karo

export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access token required",
      });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Decoded token:", decoded);

    // Pehle User model mein check karo
    let user = await User.findById(decoded.userId);
    let userType = 'user';
    
    // Agar User mein nahi mila, to Admin model mein check karo
    if (!user) {
      user = await Admin.findById(decoded.userId);
      userType = 'admin';
      console.log("Checking in Admin model...");
    }

    console.log(`Found ${userType}:`, !!user);
    console.log(`${userType} active:`, user?.isActive);

    // Agar dono mein nahi mila
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    // Active check karo (agar isActive field hai)
    if (user.hasOwnProperty('isActive') && !user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Account is inactive",
      });
    }

    // Request object mein user info attach karo
    req.userId = decoded.userId;
    req.user = user;
    req.userType = userType; // Optional: user type bhi attach kar sakte ho

    console.log(`✅ Authentication successful as ${userType}`);
    next();
    
  } catch (error) {
    console.error("Authentication error:", error);

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid token",
      });
    }

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token expired",
      });
    }

    return res.status(401).json({
      success: false,
      message: "Authentication failed",
    });
  }
};