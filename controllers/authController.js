import User, { ReferralCode } from "../models/User.js";
import jwt from "jsonwebtoken";
import { sendReferralCodeEmail } from "../services/emailService.js";
import {
  generateEmailVerificationCode,
  generateToken,
  generateUniqueReferralCode,
  validateLoginInput,
  validateSignupInput,
} from "../methods/methods.js";
import Deposit from "../models/deposit.model.js";
// Generate and send email verification code
export const generateReferralCodeForEmail = async (req, res) => {
  try {
    const { email } = req.body;

    console.log("Generate email verification code request for:", email);

    // Validate email
    if (!email || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address",
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email already registered",
      });
    }

    const code = generateEmailVerificationCode();
    console.log("Generated email verification code:", code);

    await ReferralCode.deleteMany({ email: email.toLowerCase() });

    // Save new verification code
    const verificationCode = new ReferralCode({
      email: email.toLowerCase(),
      code: code,
    });

    await verificationCode.save();
    console.log("Email verification code saved to database");

    // Send email
    console.log("Attempting to send email...");
    const emailResult = await sendReferralCodeEmail(email, code);
    console.log("Email result:", emailResult);

    if (emailResult.success) {
      const response = {
        success: true,
        message: emailResult.simulated
          ? `Email verification code generated.`
          : `Verification code sent to ${email}. Please check your email.`,
      };

      // Include code in development for debugging
      if (process.env.NODE_ENV === "development") {
        response.devCode = code;
        response.debugInfo = emailResult;
      }

      res.status(200).json(response);
    } else {
      res.status(500).json({
        success: false,
        message: "Failed to send verification code. Please try again.",
        ...(process.env.NODE_ENV === "development" && {
          debugInfo: emailResult,
        }),
      });
    }
  } catch (error) {
    console.error("Generate email verification code error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send verification code",
      ...(process.env.NODE_ENV === "development" && { error: error.message }),
    });
  }
};

// Sign up new user
export const signup = async (req, res) => {
  try {
    const {
      username,
      email,
      password,
      confirmPassword,
      mobileNo,
      emailVerificationCode,
      referredByCode, // Optional referral code
    } = req.body;

    // Validate input
    const errors = validateSignupInput(
      username,
      email,
      password,
      confirmPassword,
      mobileNo,
      emailVerificationCode,
      referredByCode
    );
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors,
      });
    }

    // Verify email verification code
    const validVerificationCode = await ReferralCode.findOne({
      email: email.toLowerCase(),
      code: emailVerificationCode.trim(),
    });

    if (!validVerificationCode) {
      return res.status(400).json({
        success: false,
        message: "Email verification code is invalid or expired",
      });
    }

    // Validate referral code if provided
    let referringUser = null;
    if (referredByCode && referredByCode.trim()) {
      referringUser = await User.findByReferralCode(referredByCode.trim());
      if (!referringUser) {
        return res.status(400).json({
          success: false,
          message: "Invalid referral code",
        });
      }
    }

    // Check if user already exists with same username
    const existingUserByUsername = await User.findOne({ username });
    if (existingUserByUsername) {
      return res.status(409).json({
        success: false,
        message: "Username already exists",
      });
    }

    // Check if user already exists with same email
    const existingUserByEmail = await User.findOne({
      email: email.toLowerCase(),
    });
    if (existingUserByEmail) {
      return res.status(409).json({
        success: false,
        message: "Email already registered",
      });
    }

    // Check if user already exists with same mobile number
    const existingUserByMobile = await User.findOne({ mobileNo });
    if (existingUserByMobile) {
      return res.status(409).json({
        success: false,
        message: "Mobile number already registered",
      });
    }

    // Generate unique referral code for new user
    const userReferralCode = await generateUniqueReferralCode();

    // Create new user
    const user = new User({
      username: username.trim(),
      email: email.toLowerCase(),
      password,
      mobileNo: mobileNo.trim(),
      myReferralCode: userReferralCode,
      referredByCode: referredByCode ? referredByCode.trim() : null,
      referredByUser: referringUser ? referringUser._id : null,
    });

    await user.save();

    // Update referring user if exists
    if (referringUser) {
      await User.findByIdAndUpdate(referringUser._id, {
        $push: { referredUsers: user._id },
        $inc: { referralCount: 1 },
      });
    }

    // Delete the used email verification code
    await ReferralCode.deleteOne({ _id: validVerificationCode._id });

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        user: user.toJSON(),
        token,
      },
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// NEW: Validate referral code endpoint
export const validateReferralCode = async (req, res) => {
  try {
    const { code } = req.params;

    if (!code || !/^[A-Z0-9]{8}$/.test(code)) {
      return res.status(400).json({
        success: false,
        message: "Invalid referral code format",
      });
    }

    const user = await User.findByReferralCode(code).select(
      "username myReferralCode"
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Invalid referral code",
      });
    }

    res.json({
      success: true,
      message: "Valid referral code",
      data: {
        referrer: {
          username: user.username,
          referralCode: user.myReferralCode,
        },
      },
    });
  } catch (error) {
    console.error("Validate referral code error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// NEW: Get user referral information
export const getUserReferrals = async (req, res) => {
  try {
    const userId = req.userId; // From auth middleware

    const user = await User.findById(userId)
      .populate("referredUsers", "username email createdAt")
      .populate("referredByUser", "username myReferralCode")
      .select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      data: {
        myReferralCode: user.myReferralCode,
        referralCount: user.referralCount,
        referredBy: user.referredByUser
          ? {
              username: user.referredByUser.username,
              referralCode: user.referredByUser.myReferralCode,
            }
          : null,
        referredUsers: user.referredUsers,
      },
    });
  } catch (error) {
    console.error("Get user referrals error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Login user (unchanged)
export const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validate input
    const errors = validateLoginInput(username, password);
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors,
      });
    }

    // Find user by username
    const user = await User.findByUsername(username.trim());
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid username or password",
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Account is deactivated",
      });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid username or password",
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        user: user.toJSON(),
        token,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      ...(process.env.NODE_ENV === "development" && { error: error.message }),
    });
  }
};

// Add this to your existing authController.js file

export const getAllUsers = async (req, res) => {
  try {
    // Fetch all users without pagination or filtering
    const users = await User.find()
      .select("-password") // Exclude password field
      .populate("referredByUser", "username myReferralCode")
      .populate("referredUsers", "username email");

    // Transform data to match frontend expectations
    const transformedUsers = users.map((user) => ({
      id: user._id,
      username: user.username,
      email: user.email,
      mobileNo: user.mobileNo || "",
      status: user.isActive ? "active" : "disabled",
      joinDate: user.createdAt.toISOString().split("T")[0],
      lastLogin: user.lastLogin
        ? user.lastLogin.toISOString().split("T")[0]
        : "Never",
      myReferralCode: user.myReferralCode,
      referralCount: user.referredUsers.length,
      referredBy: user.referredByUser
        ? {
            username: user.referredByUser.username,
            referralCode: user.referredByUser.myReferralCode,
          }
        : null,
    }));

    res.status(200).json({
      success: true,
      data: {
        users: transformedUsers,
      },
    });
  } catch (error) {
    console.error("Get all users error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      ...(process.env.NODE_ENV === "development" && { error: error.message }),
    });
  }
};

// Additional helper function for toggling user status
export const toggleUserStatus = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Toggle the isActive status
    user.isActive = !user.isActive;
    await user.save();

    res.status(200).json({
      success: true,
      message: `User ${user.isActive ? "enabled" : "disabled"} successfully`,
      data: {
        userId: user._id,
        username: user.username,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    console.error("Toggle user status error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
// Get current user profile (unchanged)
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      data: {
        user: user.toJSON(),
      },
    });
  } catch (error) {
    console.error("Profile error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Logout user (unchanged)
export const logout = async (req, res) => {
  try {
    // Since JWT is stateless, we just send a success response
    res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Update user profile (unchanged)
export const updateProfile = async (req, res) => {
  try {
    const { username, mobileNo } = req.body;
    const userId = req.userId;

    // Validate input
    const errors = [];
    if (username && (username.length < 3 || username.length > 20)) {
      errors.push({
        field: "username",
        message: "Username must be between 3 and 20 characters",
      });
    }
    if (username && !/^[a-zA-Z0-9_]+$/.test(username)) {
      errors.push({
        field: "username",
        message: "Username can only contain letters, numbers, and underscores",
      });
    }
    if (mobileNo && !/^[0-9]{10,15}$/.test(mobileNo)) {
      errors.push({
        field: "mobileNo",
        message: "Please enter a valid mobile number (10-15 digits)",
      });
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors,
      });
    }

    // Check if username or mobile number already exists (excluding current user)
    const existingUser = await User.findOne({
      $and: [{ _id: { $ne: userId } }, { $or: [{ username }, { mobileNo }] }],
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Username or mobile number already exists",
      });
    }

    // Update user
    const updateData = {};
    if (username) updateData.username = username.trim();
    if (mobileNo) updateData.mobileNo = mobileNo.trim();

    const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: {
        user: updatedUser.toJSON(),
      },
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// check auth
export const checkAuth = async (_, res) => {
  try {
    res.status(200).json({
      success: true,
      message: "User is authenticated",
    });
  } catch (error) {
    console.error("Auth check error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Simple version - just get all approved deposits for user
export const getMyDeposits = async (req, res) => {
  try {
    const { id:userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    // Get only approved deposits
    const approvedDeposits = await Deposit.find({
      userId: userId,
      status: 'approved'
    })
    .populate('productId', 'title image priceRange')
    .sort({ updatedAt: -1 })
    .select('amount updatedAt productId createdAt referredBy attachment');

    // Calculate total
    const totalAmount = approvedDeposits.reduce((sum, deposit) => sum + deposit.amount, 0);

    res.status(200).json({
      success: true,
      message: `Found ${approvedDeposits.length} approved deposits`,
      data: {
        approvedDeposits,
        totalCount: approvedDeposits.length,
        totalAmount: totalAmount
      }
    });

  } catch (error) {
    console.error('Error fetching approved deposits:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching approved deposits',
      error: error.message
    });
  }
};
