// import { generateToken } from "../methods/methods.js";
// import Admin from "../models/Admin.js";
// import User, { ReferralCode } from "../models/User.js";

// const signup = async (req, res) => {
//   try {
//     const { username, email, password, confirmPassword, verificationCode } =
//       req.body;

//     if (
//       !username ||
//       !email ||
//       !password ||
//       !confirmPassword ||
//       !verificationCode
//     ) {
//       return res.status(404).json({
//         message: "all fields are required!",
//         success: false,
//       });
//     }

//     if (password !== confirmPassword) {
//       return res.status(400).json({
//         message: "passwords do not match!",
//         success: false,
//       });
//     }

//     const isCodeVerified = await ReferralCode.findOne({ verificationCode });

//     if (isCodeVerified) {
//       return res.status(404).json({
//         message: "invalid code",
//         success: false,
//       });
//     }

//     const existingAdmin = await Admin.findOne({ email });

//     if (existingAdmin) {
//       return res.status(400).json({
//         message: "already have an account!",
//         success: false,
//       });
//     }

//     await ReferralCode.findByIdAndDelete(isCodeVerified?._id);

//     const newAdmin = new Admin({
//       username,
//       password,
//       email,
//     });
//     await newAdmin.save();

//     const token = generateToken(newAdmin._id);

//     res.status(201).json({
//       success: true,
//       message: "User registered successfully",
//       data: {
//         user: newAdmin.toJSON(),
//         token,
//       },
//     });
//   } catch (error) {
//     res.status(500).json({
//       message: error.message,
//       success: false,
//     });
//   }
// };

// const login = async (req, res) => {
//   try {
//     const { password, email, emailCode } = req.body;

//     if (!email || !password || !emailCode) {
//       return res.status(404).json({
//         message: "all fields are required!",
//         success: false,
//       });
//     }

//     const isCodeVerified = await ReferralCode.findOne({ emailCode });

//     if (isCodeVerified) {
//       return res.status(404).json({
//         message: "invalid code",
//         success: false,
//       });
//     }

//     const admin = await Admin.findOne({ email });

//     if (!admin) {
//       return res.status(404).json({
//         message: "invaild credentials!",
//         success: false,
//       });
//     }

//     const validPassword = await admin.comparePassword(password);

//     if (!validPassword) {
//       return res.status(404).json({
//         message: "password do not matched!",
//         success: false,
//       });
//     }

//     await ReferralCode.findByIdAndDelete(isCodeVerified?._id);

//     const token = generateToken(admin._id);

//     res.status(201).json({
//       success: true,
//       message: `welcome back ${admin.username}`,
//       data: {
//         user: admin.toJSON(),
//         token,
//       },
//     });
//   } catch (error) {
//     res.status(500).json({
//       message: error.message,
//       success: false,
//     });
//   }
// };

// const updateProfile = async (req, res) => {
//   try {
//     const { bankName, walletId } = req.body;
//     const { id: userId } = req.params;

//     const user = await Admin.findById(userId);

//     if (!user) {
//       return res.status(404).json({
//         message: "invalid user",
//         success: false,
//       });
//     }

//     await Admin.updateOne(
//       { _id: userId },
//       {
//         walletId,
//         bankName,
//       }
//     );

//     return res.status(200).json({
//       message: "profile updated successfully!",
//       success: true,
//     });
//   } catch (error) {
//     res.status(500).json({
//       message: error.message,
//       success: false,
//     });
//   }
// };

// const logout = async (req, res) => {
//   try {
//     res.status(200).json({
//       message: "logout successfully",
//       success: true,
//     });
//   } catch (error) {
//     res.status(500).json({
//       message: error.message,
//       success: false,
//     });
//   }
// };

// // NEW GET API - Get Admin Profile by ID
// const getProfile = async (req, res) => {
//   try {
//     const { id: userId } = req.params;

//     console.log(userId)

//     // Validate if userId is provided
//     if (!userId) {
//       return res.status(400).json({
//         message: "User ID is required",
//         success: false,
//       });
//     }

//     // Find admin by ID and exclude password field
//     const admin = await Admin.findById(userId).select("-password");

//     if (!admin) {
//       return res.status(404).json({
//         message: "Admin not found",
//         success: false,
//       });
//     }

//     res.status(200).json({
//       success: true,
//       message: "Admin profile retrieved successfully",
//       data: {
//         user: admin.toJSON(),
//       },
//     });
//   } catch (error) {
//     // Handle invalid ObjectId format
//     if (error.name === "CastError") {
//       return res.status(400).json({
//         message: "Invalid user ID format",
//         success: false,
//       });
//     }

//     res.status(500).json({
//       message: error.message,
//       success: false,
//     });
//   }
// };

// const getActiveUsers = async (_, res) => {
//   try {
//     const activeUsers = await User.find({ isActive: true }).select("-password");

//     if (activeUsers.length === 0) {
//       return res.status(404).json({
//         message: "No active users found",
//         success: false,
//       });
//     }

//     return res.status(200).json({
//       success: true,
//       message: "Active users retrieved successfully",
//       data: {
//         users: activeUsers,
//       },
//     });

//   } catch (error) {
//     console.error("Error fetching active users:", error.message);  // ✅ logging
//     return res.status(500).json({
//       success: false,
//       message: "Internal server error",
//       error: error.message, // optional for debugging
//     });
//   }
// };

// export { signup, login, logout, updateProfile, getProfile, getActiveUsers };

import { generateToken } from "../methods/methods.js";
import Admin from "../models/Admin.js";
import User from "../models/User.js";
import { uploadToCloudinary } from "../services/cloudinaryService.js";

const login = async (req, res) => {
  try {
    const { password, email, totpToken } = req.body;

    if (!email || !password || !totpToken) {
      return res.status(400).json({
        message: "Email, password, and TOTP token are required!",
        success: false,
      });
    }

    const admin = await Admin.findOne({ email });

    if (!admin) {
      return res.status(404).json({
        message: "Invalid credentials!",
        success: false,
      });
    }

    const validPassword = await admin.comparePassword(password);

    if (!validPassword) {
      return res.status(400).json({
        message: "Invalid credentials!",
        success: false,
      });
    }

    // Check if TOTP is enabled and verify token
    if (!admin.isTotpEnabled) {
      return res.status(400).json({
        message:
          "Google Authenticator is not set up. Please contact administrator.",
        success: false,
      });
    }

    const validTotpToken = admin.verifyTotpToken(totpToken);

    if (!validTotpToken) {
      return res.status(400).json({
        message: "Invalid or expired TOTP token!",
        success: false,
      });
    }

    const token = generateToken(admin._id);

    res.status(200).json({
      success: true,
      message: `Welcome back ${admin.username}`,
      data: {
        user: admin.toJSON(),
        token,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
      success: false,
    });
  }
};

// Generate QR Code for Google Authenticator setup
const generateAuthenticatorQR = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        message: "Email is required!",
        success: false,
      });
    }

    const admin = await Admin.findOne({ email });

    if (!admin) {
      return res.status(404).json({
        message: "Admin not found!",
        success: false,
      });
    }

    // Generate TOTP secret if not exists
    if (!admin.totpSecret) {
      admin.generateTotpSecret();
      await admin.save();
    }

    // Generate QR code
    const qrCodeDataURL = await admin.generateQRCode();

    res.status(200).json({
      success: true,
      message: "QR Code generated successfully",
      data: {
        qrCode: qrCodeDataURL,
        secret: admin.totpSecret, // For manual entry if QR doesn't work
        setupComplete: admin.totpSetupComplete,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
      success: false,
    });
  }
};

// Verify and enable TOTP
const verifyAndEnableTotp = async (req, res) => {
  try {
    const { email, totpToken } = req.body;

    if (!email || !totpToken) {
      return res.status(400).json({
        message: "Email and TOTP token are required!",
        success: false,
      });
    }

    const admin = await Admin.findOne({ email });

    if (!admin) {
      return res.status(404).json({
        message: "Admin not found!",
        success: false,
      });
    }

    if (!admin.totpSecret) {
      return res.status(400).json({
        message: "TOTP secret not found. Please generate QR code first.",
        success: false,
      });
    }

    const isValidToken = admin.enableTotp(totpToken);

    if (!isValidToken) {
      return res.status(400).json({
        message: "Invalid TOTP token!",
        success: false,
      });
    }

    await admin.save();

    res.status(200).json({
      success: true,
      message: "Google Authenticator enabled successfully!",
      data: {
        totpEnabled: admin.isTotpEnabled,
        setupComplete: admin.totpSetupComplete,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
      success: false,
    });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { bankName, walletId } = req.body;
    const { id: userId } = req.params;

    const user = await Admin.findById(userId);

    if (!user) {
      return res.status(404).json({
        message: "Invalid user",
        success: false,
      });
    }

    await Admin.updateOne(
      { _id: userId },
      {
        walletId,
        bankName,
      }
    );

    return res.status(200).json({
      message: "Profile updated successfully!",
      success: true,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
      success: false,
    });
  }
};

const logout = async (req, res) => {
  try {
    res.status(200).json({
      message: "Logout successful",
      success: true,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
      success: false,
    });
  }
};

const getProfile = async (req, res) => {
  try {
    const { id: userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        message: "User ID is required",
        success: false,
      });
    }

    const admin = await Admin.findById(userId).select("-password");

    if (!admin) {
      return res.status(404).json({
        message: "Admin not found",
        success: false,
      });
    }

    res.status(200).json({
      success: true,
      message: "Admin profile retrieved successfully",
      data: {
        user: admin.toJSON(),
      },
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        message: "Invalid user ID format",
        success: false,
      });
    }

    res.status(500).json({
      message: error.message,
      success: false,
    });
  }
};

const getActiveUsers = async (_, res) => {
  try {
    const activeUsers = await User.find({ isActive: true }).select("-password");

    if (activeUsers.length === 0) {
      return res.status(404).json({
        message: "No active users found",
        success: false,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Active users retrieved successfully",
      data: {
        users: activeUsers,
      },
    });
  } catch (error) {
    console.error("Error fetching active users:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};
const updateNetworkImages = async (req, res) => {
  try {
    const { bep20Id, trc20Id } = req.body;
    const files = req.files || {};
    const adminId = req.userId;

    const admin = await Admin.findById(adminId);
    if (!admin) {
      return res
        .status(404)
        .json({ message: "Admin not found", success: false });
    }

    if (!admin.networks) {
      admin.networks = {};
    }

    let updated = false;

    // Upload BEP-20 image to Cloudinary
    if (files.bep20Img && files.bep20Img[0]) {
      const result = await uploadToCloudinary(files.bep20Img[0], "networks");
      admin.networks.bep20Img = result.url;
      updated = true;
    }

    // Upload TRC-20 image to Cloudinary
    if (files.trc20Img && files.trc20Img[0]) {
      const result = await uploadToCloudinary(files.trc20Img[0], "networks");
      admin.networks.trc20Img = result.url;
      updated = true;
    }

    if (bep20Id && bep20Id.trim() !== "") {
      admin.networks.bep20Id = bep20Id.trim();
      updated = true;
    }

    if (trc20Id && trc20Id.trim() !== "") {
      admin.networks.trc20Id = trc20Id.trim();
      updated = true;
    }

    if (!updated) {
      return res.status(400).json({
        message: "No valid data provided for update",
        success: false,
      });
    }

    const savedAdmin = await admin.save();

    return res.status(200).json({
      message: "Network images and data updated successfully",
      success: true,
      data: {
        networks: savedAdmin.networks,
      },
    });
  } catch (error) {
    console.error("Error updating network images:", error);
    return res.status(500).json({
      message: "Internal server error",
      success: false,
      error: error.message,
    });
  }
};

const getNetworkImages = async (req, res) => {
  try {
    const adminId = req.userId;
    const admin = await Admin.findById(adminId);

    if (!admin) {
      return res.status(404).json({
        message: "Admin not found",
        success: false,
      });
    }

    return res.status(200).json({
      message: "Network data fetched successfully",
      success: true,
      data: {
        networks: admin.networks || {},
      },
    });
  } catch (error) {
    console.error("Error fetching network images:", error);
    return res.status(500).json({
      message: "Internal server error",
      success: false,
      error: error.message,
    });
  }
};


export {
  login,
  logout,
  updateProfile,
  getProfile,
  getActiveUsers,
  generateAuthenticatorQR,
  verifyAndEnableTotp,
  updateNetworkImages,
  getNetworkImages
};
