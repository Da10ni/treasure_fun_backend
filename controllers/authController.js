import User, { PasswordResetCode, ReferralCode } from "../models/User.js";
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

    // const existingUser = await User.findOne({ email: email.toLowerCase() });
    // if (existingUser) {
    //   return res.status(409).json({
    //     success: false,
    //     message: "Email already registered",
    //   });
    // }

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

const autoUpdateUserLevel = async (userId) => {
  try {
    console.log(`🔄 Auto-updating level for user: ${userId}`);

    // Find user with populated referredUsers
    const user = await User.findById(userId).populate("referredUsers");

    if (!user) {
      console.error(`❌ User not found: ${userId}`);
      return null;
    }

    // Count actual referrals
    const currentReferralCount = user.referredUsers
      ? user.referredUsers.length
      : 0;

    // Get current level
    const currentLevel = user.levels || 1;

    // Calculate new level
    const calculatedLevel = calculateUserLevel(currentReferralCount);

    console.log(
      `📊 ${user.username}: ${currentReferralCount} referrals, Level ${currentLevel} → ${calculatedLevel}`
    );

    // Update level if changed
    if (calculatedLevel !== currentLevel) {
      user.levels = calculatedLevel;
      await user.save();

      console.log(
        `✅ Level auto-updated: ${user.username} is now Level ${calculatedLevel}`
      );

      return {
        levelUpdated: true,
        oldLevel: currentLevel,
        newLevel: calculatedLevel,
        referralCount: currentReferralCount,
        username: user.username,
      };
    } else {
      console.log(
        `ℹ️ Level unchanged: ${user.username} remains at Level ${currentLevel}`
      );
      return {
        levelUpdated: false,
        currentLevel: currentLevel,
        referralCount: currentReferralCount,
        username: user.username,
      };
    }
  } catch (error) {
    console.error("❌ Error in auto level update:", error);
    return null;
  }
};

// Updated signup function
export const signup = async (req, res) => {
  try {
    const {
      username,
      email,
      password,
      confirmPassword,
      mobileNo,
      referredByCode,
      walletId, // TRC-20 wallet
      BEP, // BEP-20 wallet (matching schema field name)
    } = req.body;

    // Validate input (remove emailVerificationCode from validation)
    const errors = validateSignupInput(
      username,
      email,
      password,
      confirmPassword,
      mobileNo,
      referredByCode
    );

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors,
      });
    }

    console.log("TRC-20 Wallet:", walletId);
    console.log("BEP-20 Wallet:", BEP);

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
      walletId, // TRC-20 wallet
      BEP, // BEP-20 wallet (matching schema field name)
      myReferralCode: userReferralCode,
      referredByCode: referredByCode ? referredByCode.trim() : null,
      referredByUser: referringUser ? referringUser._id : null,
    });

    await user.save();

    // Update referring user if exists
    let levelUpdateResult = null;
    if (referringUser) {
      // Update referral data
      await User.findByIdAndUpdate(referringUser._id, {
        $push: { referredUsers: user._id },
        $inc: { referralCount: 1 },
      });

      console.log(`🎯 New referral added for ${referringUser.username}`);

      // 🔥 AUTO UPDATE LEVEL - Yahan magic hota hai!
      levelUpdateResult = await autoUpdateUserLevel(referringUser._id);

      if (levelUpdateResult && levelUpdateResult.levelUpdated) {
        console.log(
          `🎉 LEVEL UP! ${referringUser.username}: Level ${levelUpdateResult.oldLevel} → ${levelUpdateResult.newLevel}`
        );
      }
    }

    // Generate token
    const token = generateToken(user._id);

    // Response with level update info
    const response = {
      success: true,
      message: "User registered successfully",
      data: {
        user: user.toJSON(),
        token,
      },
    };

    // Add level update info to response if available
    if (levelUpdateResult && levelUpdateResult.levelUpdated) {
      response.levelUpdate = {
        referrerUsername: levelUpdateResult.username,
        oldLevel: levelUpdateResult.oldLevel,
        newLevel: levelUpdateResult.newLevel,
        message: `🎉 ${levelUpdateResult.username} leveled up to Level ${levelUpdateResult.newLevel}!`,
      };
    }

    res.status(201).json(response);
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

    const user = await User.findOne({
      $or: [{ username: username.trim() }, { email: username.trim() }],
    });
    console.log(user);
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

// Update user profile
// export const updateProfile = async (req, res) => {
//   try {
//     const { username, mobileNo, walletId, BEP, email, bankName } = req.body;
//     const userId = req.userId;

//     // Input Validation
//     const errors = [];
//     if (username) {
//       if (username.length < 3 || username.length > 20) {
//         errors.push({
//           field: "username",
//           message: "Username must be between 3 and 20 characters",
//         });
//       }
//       if (!/^[a-zA-Z0-9_]+$/.test(username)) {
//         errors.push({
//           field: "username",
//           message:
//             "Username can only contain letters, numbers, and underscores",
//         });
//       }
//     }
//     if (mobileNo && !/^[0-9]{10,15}$/.test(mobileNo)) {
//       errors.push({
//         field: "mobileNo",
//         message: "Please enter a valid mobile number (10–15 digits)",
//       });
//     }
//     if (errors.length > 0) {
//       return res.status(400).json({
//         success: false,
//         message: "Validation failed",
//         errors,
//       });
//     }

//     // Check if username or mobile number already exists (excluding current user)
//     const existingUser = await User.findOne({
//       _id: { $ne: userId },
//       $or: [
//         ...(username ? [{ username }] : []),
//         ...(mobileNo ? [{ mobileNo }] : []),
//       ],
//     });

//     if (existingUser) {
//       return res.status(409).json({
//         success: false,
//         message: "Username or mobile number already exists",
//       });
//     }

//     // Prepare update object
//     const updateData = {};
//     if (username) updateData.username = username.trim();
//     if (email) updateData.email = email.trim();
//     if (mobileNo) updateData.mobileNo = mobileNo.trim();
//     if (walletId) updateData.walletId = walletId.trim(); // TRC-20
//     if (BEP) updateData.BEP = BEP.trim(); // BEP-20
//     if (bankName) updateData.bankName = bankName.trim();

//     // 🔥 NEW: Set freeze status and timestamp
//     updateData.isFreezed = true;
//     updateData.freezeTimestamp = new Date(); // Store when freeze started

//     // Update user document
//     const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
//       new: true,
//       runValidators: true,
//     });

//     return res.status(200).json({
//       success: true,
//       message:
//         "Profile updated successfully. Withdrawals disabled for 72 hours.",
//       data: {
//         user: updatedUser.toJSON(),
//       },
//     });
//   } catch (error) {
//     console.error("Update profile error:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Internal server error",
//     });
//   }
// };

export const updateProfile = async (req, res) => {
  try {
    const { username, mobileNo, walletId, BEP, email, bankName } = req.body;
    const userId = req.userId;

    // Input Validation
    const errors = [];
    if (username) {
      if (username.length < 3 || username.length > 20) {
        errors.push({
          field: "username",
          message: "Username must be between 3 and 20 characters",
        });
      }
      if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        errors.push({
          field: "username",
          message:
            "Username can only contain letters, numbers, and underscores",
        });
      }
    }
    if (mobileNo && !/^[0-9]{10,15}$/.test(mobileNo)) {
      errors.push({
        field: "mobileNo",
        message: "Please enter a valid mobile number (10–15 digits)",
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
      _id: { $ne: userId },
      $or: [
        ...(username ? [{ username }] : []),
        ...(mobileNo ? [{ mobileNo }] : []),
      ],
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Username or mobile number already exists",
      });
    }

    // 🔥 NEW: Get current user data to check for wallet changes
    const currentUser = await User.findById(userId);
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // 🔥 NEW: Check if wallet addresses are being updated
    const isWalletIdUpdating =
      walletId && walletId.trim() !== (currentUser.walletId || "");
    const isBEPUpdating = BEP && BEP.trim() !== (currentUser.BEP || "");
    const isWalletUpdating = isWalletIdUpdating || isBEPUpdating;

    console.log("🔍 Wallet Update Check:", {
      isWalletIdUpdating,
      isBEPUpdating,
      isWalletUpdating,
      currentTRC: currentUser.walletId,
      newTRC: walletId,
      currentBEP: currentUser.BEP,
      newBEP: BEP,
    });

    // Prepare update object
    const updateData = {};
    if (username) updateData.username = username.trim();
    if (email) updateData.email = email.trim();
    if (mobileNo) updateData.mobileNo = mobileNo.trim();
    if (walletId) updateData.walletId = walletId.trim(); // TRC-20
    if (BEP) updateData.BEP = BEP.trim(); // BEP-20
    if (bankName) updateData.bankName = bankName.trim();

    // 🔥 NEW: Conditional freeze - only if wallet addresses are being updated
    if (isWalletUpdating) {
      updateData.isFreezed = true;
      updateData.freezeTimestamp = new Date();

      console.log("🧊 User will be frozen due to wallet address update");
    } else {
      console.log("✅ No wallet address changes - user will not be frozen");
    }

    // Update user document
    const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
      runValidators: true,
    });

    // Determine response message based on freeze status
    let message = "Profile updated successfully.";
    if (isWalletUpdating) {
      message +=
        " Withdrawals disabled for 72 hours due to wallet address changes.";
    }

    return res.status(200).json({
      success: true,
      message: message,
      data: {
        user: updatedUser.toJSON(),
        freezeInfo: {
          isFreezed: updatedUser.isFreezed,
          freezeTimestamp: updatedUser.freezeTimestamp,
          reason: isWalletUpdating ? "Wallet address updated" : "Not frozen",
          walletUpdated: isWalletUpdating,
          updatedFields: {
            trc20Updated: isWalletIdUpdating,
            bep20Updated: isBEPUpdating,
          },
        },
      },
    });
  } catch (error) {
    console.error("Update profile error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// 🔥 NEW: Enhanced freeze status check with reason
export const checkUserFreezeStatusEnhanced = async (req, res) => {
  try {
    const userId = req.userId || req.params.userId;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if user should be auto-unfrozen
    const wasUnfrozen = user.checkAndUnfreeze();
    if (wasUnfrozen) {
      await user.save();
      console.log(`🔥 Auto-unfroze user: ${user.username}`);
    }

    let freezeStatus = {
      isFreezed: user.isFreezed,
      timeRemaining: 0,
      canWithdraw: !user.isFreezed,
      username: user.username,
      freezeReason: user.isFreezed ? "Wallet address security freeze" : null,
    };

    if (user.isFreezed && user.freezeTimestamp) {
      const timeRemaining = user.getFreezeTimeRemaining();
      const unfreezeAt = new Date(
        user.freezeTimestamp.getTime() + 72 * 60 * 60 * 1000
      );

      freezeStatus = {
        isFreezed: true,
        timeRemaining: timeRemaining,
        canWithdraw: false,
        freezeStartTime: user.freezeTimestamp,
        unfreezeAt: unfreezeAt,
        username: user.username,
        freezeDurationHours: 72,
        freezeReason: "Wallet address was recently updated for security",
      };
    }

    return res.status(200).json({
      success: true,
      message: `Freeze status for ${user.username}`,
      data: freezeStatus,
    });
  } catch (error) {
    console.error("Check freeze status error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Something went wrong",
    });
  }
};

// 🔥 NEW: Function to unfreeze users whose 72-hour period has ended
export const checkAndUnfreezeUsers = async () => {
  try {
    const seventyTwoHoursAgo = new Date(Date.now() - 72 * 60 * 60 * 1000);

    const result = await User.updateMany(
      {
        isFreezed: true,
        freezeTimestamp: { $lt: seventyTwoHoursAgo },
      },
      {
        $set: { isFreezed: false },
        $unset: { freezeTimestamp: "" },
      }
    );

    console.log(
      `Unfroze ${result.modifiedCount} users whose freeze period expired`
    );
    return result.modifiedCount;
  } catch (error) {
    console.error("Error unfreezing users:", error);
  }
};

// 🔥 NEW: API endpoint to manually check user freeze status
export const checkUserFreezeStatus = async (req, res) => {
  try {
    const userId = req.userId;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    let freezeStatus = {
      isFreezed: user.isFreezed,
      timeRemaining: 0,
      canWithdraw: !user.isFreezed,
    };

    if (user.isFreezed && user.freezeTimestamp) {
      const currentTime = new Date();
      const freezeTime = new Date(user.freezeTimestamp);
      const timePassed = currentTime - freezeTime;
      const seventyTwoHours = 72 * 60 * 60 * 1000;
      const timeRemaining = seventyTwoHours - timePassed;

      if (timeRemaining <= 0) {
        // Freeze period has ended, unfreeze the user
        user.isFreezed = false;
        user.freezeTimestamp = undefined;
        await user.save();

        freezeStatus = {
          isFreezed: false,
          timeRemaining: 0,
          canWithdraw: true,
        };
      } else {
        freezeStatus = {
          isFreezed: true,
          timeRemaining: timeRemaining,
          canWithdraw: false,
          freezeStartTime: user.freezeTimestamp,
        };
      }
    }

    return res.status(200).json({
      success: true,
      data: freezeStatus,
    });
  } catch (error) {
    console.error("Check freeze status error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// 🔥 NEW: Cron job function (call this every hour)
export const scheduledUnfreezeCheck = () => {
  // Run every hour to check for expired freezes
  setInterval(checkAndUnfreezeUsers, 60 * 60 * 1000); // 1 hour
  console.log("Scheduled unfreeze checker started - runs every hour");
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
    const { id: userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    // Get only approved deposits
    const approvedDeposits = await Deposit.find({
      userId: userId,
      status: "approved",
    })
      .populate("productId", "title image priceRange")
      .sort({ updatedAt: -1 })
      .select("amount updatedAt productId createdAt referredBy attachment");

    // Calculate total
    const totalAmount = approvedDeposits.reduce(
      (sum, deposit) => sum + deposit.amount,
      0
    );

    res.status(200).json({
      success: true,
      message: `Found ${approvedDeposits.length} approved deposits`,
      data: {
        approvedDeposits,
        totalCount: approvedDeposits.length,
        totalAmount: totalAmount,
      },
    });
  } catch (error) {
    console.error("Error fetching approved deposits:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching approved deposits",
      error: error.message,
    });
  }
};

export const sendPasswordResetCode = async (req, res) => {
  try {
    const { email } = req.body;

    console.log("Password reset code request for:", email);

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

    // Check if user exists
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "No account found with this email address",
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Account is deactivated. Please contact support.",
      });
    }

    // Generate reset code
    const resetCode = generateEmailVerificationCode();
    console.log("Generated password reset code:", resetCode);

    // Delete any existing reset codes for this email
    await PasswordResetCode.deleteMany({ email: email.toLowerCase() });

    // Save new reset code
    const passwordResetCode = new PasswordResetCode({
      email: email.toLowerCase(),
      code: resetCode,
      userId: user._id,
    });

    await passwordResetCode.save();
    console.log("Password reset code saved to database");

    // Send email with 'password_reset' type
    console.log("Attempting to send password reset email...");
    const emailResult = await sendReferralCodeEmail(
      email,
      resetCode,
      "password_reset"
    );
    console.log("Email result:", emailResult);

    if (emailResult.success) {
      const response = {
        success: true,
        message: emailResult.simulated
          ? `Password reset code generated successfully.`
          : `Password reset code sent to ${email}. Please check your email.`,
      };

      // Include code in development for debugging
      if (process.env.NODE_ENV === "development") {
        response.devCode = resetCode;
        response.debugInfo = emailResult;
      }

      res.status(200).json(response);
    } else {
      res.status(500).json({
        success: false,
        message: "Failed to send password reset code. Please try again.",
        ...(process.env.NODE_ENV === "development" && {
          debugInfo: emailResult,
        }),
      });
    }
  } catch (error) {
    console.error("Send password reset code error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send password reset code",
      ...(process.env.NODE_ENV === "development" && { error: error.message }),
    });
  }
};

// 2. Verify Reset Code (Optional - for frontend validation)
export const verifyResetCode = async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({
        success: false,
        message: "Email and reset code are required",
      });
    }

    const resetCodeDoc = await PasswordResetCode.findOne({
      email: email.toLowerCase(),
      code: code.trim(),
    });

    if (!resetCodeDoc) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset code",
      });
    }

    res.status(200).json({
      success: true,
      message: "Reset code is valid",
    });
  } catch (error) {
    console.error("Verify reset code error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to verify reset code",
    });
  }
};

// 3. Reset Password
export const resetPassword = async (req, res) => {
  try {
    const { email, code, newPassword, confirmPassword } = req.body;

    // Validate input
    const errors = [];

    if (!email || !email.trim()) {
      errors.push({ field: "email", message: "Email is required" });
    }

    if (!code || !code.trim()) {
      errors.push({ field: "code", message: "Reset code is required" });
    }

    if (!newPassword) {
      errors.push({
        field: "newPassword",
        message: "New password is required",
      });
    }

    if (newPassword && newPassword.length < 6) {
      errors.push({
        field: "newPassword",
        message: "Password must be at least 6 characters long",
      });
    }

    if (newPassword !== confirmPassword) {
      errors.push({
        field: "confirmPassword",
        message: "Passwords do not match",
      });
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors,
      });
    }

    // Verify reset code
    const resetCodeDoc = await PasswordResetCode.findOne({
      email: email.toLowerCase(),
      code: code.trim(),
    });

    if (!resetCodeDoc) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset code",
      });
    }

    // Get user
    const user = await User.findById(resetCodeDoc.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Account is deactivated. Please contact support.",
      });
    }

    // Update password
    user.password = newPassword; // Pre-save hook will hash it
    await user.save();

    // Delete the used reset code
    await PasswordResetCode.deleteOne({ _id: resetCodeDoc._id });

    // Generate new token for auto login
    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: "Password reset successful",
      data: {
        user: user.toJSON(),
        token, // Auto login user
      },
    });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to reset password",
      ...(process.env.NODE_ENV === "development" && { error: error.message }),
    });
  }
};

// 4. Change Password (for logged in users)
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    const userId = req.userId; // From auth middleware

    // Validate input
    const errors = [];

    if (!currentPassword) {
      errors.push({
        field: "currentPassword",
        message: "Current password is required",
      });
    }

    if (!newPassword) {
      errors.push({
        field: "newPassword",
        message: "New password is required",
      });
    }

    if (newPassword && newPassword.length < 6) {
      errors.push({
        field: "newPassword",
        message: "Password must be at least 6 characters long",
      });
    }

    if (newPassword !== confirmPassword) {
      errors.push({
        field: "confirmPassword",
        message: "Passwords do not match",
      });
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors,
      });
    }

    // Get user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    // Check if new password is different from current
    const isSamePassword = await user.comparePassword(newPassword);
    if (isSamePassword) {
      return res.status(400).json({
        success: false,
        message: "New password must be different from current password",
      });
    }

    // Update password
    user.password = newPassword; // Pre-save hook will hash it
    await user.save();

    res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to change password",
      ...(process.env.NODE_ENV === "development" && { error: error.message }),
    });
  }
};

const calculateUserLevel = (referralCount) => {
  if (referralCount >= 240) return 5; // Level 5 for 14+ referrals
  if (referralCount >= 120) return 4; // Level 4 for 10+ referrals
  if (referralCount >= 60) return 3; // Level 3 for 5+ referrals
  if (referralCount >= 16) return 2; // Level 2 for 2+ referrals
  return 1; // Default level 1 (for 0-1 referrals)
};

// 🔥 Check and upgrade user level based on referral count
export const upgradeLevels = async (req, res) => {
  try {
    const { userId } = req.body;

    console.log(`🔄 Checking and updating level for user: ${userId}`);

    // Find the user with populated referredUsers
    const user = await User.findById(userId).populate("referredUsers");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
        success: false,
      });
    }

    // Count actual referrals from database
    const currentReferralCount = user.referredUsers
      ? user.referredUsers.length
      : 0;

    // Get current level from user document
    const currentLevel = user.levels || 1;

    // Calculate what level should be based on referrals
    const calculatedLevel = calculateUserLevel(currentReferralCount);

    // Always update the level (force update every call)
    user.levels = calculatedLevel;
    await user.save();

    console.log(
      `✅ Level updated: ${user.username} is now Level ${calculatedLevel}`
    );

    // Check if level was upgraded
    const levelUpgraded = calculatedLevel > currentLevel;

    return res.status(200).json({
      message: levelUpgraded
        ? `🎉 Congratulations! Level upgraded to Level ${calculatedLevel}!`
        : `Level confirmed: You are Level ${calculatedLevel}`,
      success: true,
      data: {
        userId: user._id,
        username: user.username,
        previousLevel: currentLevel,
        currentLevel: calculatedLevel,
        referralCount: currentReferralCount,
        levelUpgraded: levelUpgraded,
        nextLevelRequirement: getNextLevelRequirement(
          calculatedLevel,
          currentReferralCount
        ),
      },
    });
  } catch (error) {
    console.error("❌ Error in level check/upgrade:", error);
    return res.status(500).json({
      message: error.message,
      success: false,
    });
  }
};

// Helper function to get next level requirement
const getNextLevelRequirement = (currentLevel, currentReferrals) => {
  const levelRequirements = {
    1: { next: 2, required: 16 },
    2: { next: 3, required: 60 },
    3: { next: 4, required: 120 },
    4: { next: 5, required: 240 },
    5: { next: null, required: null }, // Max level
  };

  const levelInfo = levelRequirements[currentLevel];

  if (!levelInfo || !levelInfo.next) {
    return null; // Max level reached
  }

  const remaining = levelInfo.required - currentReferrals;
  return {
    nextLevel: levelInfo.next,
    referralsNeeded: Math.max(0, remaining),
    totalRequired: levelInfo.required,
  };
};

const RESERVE_LIMITS = {
  1: { min: 50, max: 1000 },
  2: { min: 500, max: 2000 },
  3: { min: 2000, max: 5000 },
  4: { min: 5000, max: 10000 },
  5: { min: 10000, max: 20000 },
};

export const handelReserve = async (req, res) => {
  try {
    const { userId, reserveAmount } = req.body;

    // Validation
    if (!userId || !reserveAmount) {
      return res.status(400).json({
        success: false,
        message: "User ID and reserve amount are required",
      });
    }

    if (reserveAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Reserve amount must be greater than 0",
      });
    }

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Get user level (assuming user has a level field, default to 1 if not set)
    const userLevel = user.levels || 1;

    // Check if level is valid
    if (!RESERVE_LIMITS[userLevel]) {
      return res.status(400).json({
        success: false,
        message: "Invalid user level",
      });
    }

    // Get limits for user's level
    const { min, max } = RESERVE_LIMITS[userLevel];

    // Validate amount against level limits
    if (reserveAmount < min || reserveAmount > max) {
      return res.status(400).json({
        success: false,
        message: `Reserve amount must be between $${min} and $${max} for level ${userLevel}`,
        data: {
          userLevel,
          minAmount: min,
          maxAmount: max,
          requestedAmount: reserveAmount,
        },
      });
    }

    // Check wallet balance
    const walletBalance = user.walletBalance || 0;
    if (reserveAmount > walletBalance) {
      return res.status(400).json({
        success: false,
        message: "Insufficient wallet balance",
      });
    }

    // Check if user can reserve (24-hour cooldown)
    const now = new Date();
    if (user.reserveCooldownExpires && now < user.reserveCooldownExpires) {
      const timeRemaining =
        user.reserveCooldownExpires.getTime() - now.getTime();
      return res.status(400).json({
        success: false,
        message: "Reserve is on cooldown",
        data: {
          timeRemaining,
          canReserve: false,
        },
      });
    }

    // Calculate new reserve amount and cooldown expiry
    const currentReserve = user.reserve || 0;
    const newReserveAmount = currentReserve + parseFloat(reserveAmount);
    const cooldownExpiry = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          reserve: newReserveAmount,
          lastReserveTime: now,
          reserveCooldownExpires: cooldownExpiry,
        },
      },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: "Amount reserved successfully",
      data: {
        user: {
          _id: updatedUser._id,
          username: updatedUser.username,
          email: updatedUser.email,
          walletBalance: updatedUser.walletBalance,
          reserve: updatedUser.reserve,
          level: updatedUser.levels,
          lastReserveTime: updatedUser.lastReserveTime,
          reserveCooldownExpires: updatedUser.reserveCooldownExpires,
        },
        reserveAmount: reserveAmount,
        totalReserve: newReserveAmount,
        cooldownExpires: cooldownExpiry,
        levelLimits: RESERVE_LIMITS[userLevel],
      },
    });
  } catch (error) {
    console.error("Reserve error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Something went wrong",
    });
  }
};

// GET /auth/reserve-status/:userId - Get reserve status
export const handelReservestatus = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).select(
      "reserve lastReserveTime reserveCooldownExpires walletBalance level"
    );
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const now = new Date();
    const canReserve =
      !user.reserveCooldownExpires || now >= user.reserveCooldownExpires;

    let timeRemaining = 0;
    if (user.reserveCooldownExpires && now < user.reserveCooldownExpires) {
      timeRemaining = user.reserveCooldownExpires.getTime() - now.getTime();
    }

    // Get level limits
    const userLevel = user.levels || 1;
    const levelLimits = RESERVE_LIMITS[userLevel] || RESERVE_LIMITS[1];

    res.status(200).json({
      success: true,
      data: {
        reserve: user.reserve || 0,
        walletBalance: user.walletBalance || 0,
        level: userLevel,
        levelLimits: levelLimits,
        lastReserveTime: user.lastReserveTime,
        reserveCooldownExpires: user.reserveCooldownExpires,
        canReserve: canReserve,
        timeRemaining: timeRemaining,
      },
    });
  } catch (error) {
    console.error("Get reserve status error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Something went wrong",
    });
  }
};

// GET /auth/user/:userId/reserves - Get user's reserve history (optional)
export const handelReserveUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).select(
      "reserve lastReserveTime reserveCooldownExpires level"
    );
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Get level limits
    const userLevel = user.levels || 1;
    const levelLimits = RESERVE_LIMITS[userLevel] || RESERVE_LIMITS[1];

    res.status(200).json({
      success: true,
      data: {
        totalReserve: user.reserve || 0,
        userLevel: userLevel,
        levelLimits: levelLimits,
        lastReserveTime: user.lastReserveTime,
        nextReserveAvailable: user.reserveCooldownExpires,
      },
    });
  } catch (error) {
    console.error("Get reserves error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
