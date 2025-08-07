import { generateToken } from "../methods/methods.js";
import Admin from "../models/Admin.js";
import { ReferralCode } from "../models/User.js";

const signup = async (req, res) => {
  try {
    const { username, email, password, confirmPassword, verificationCode } =
      req.body;

    if (
      !username ||
      !email ||
      !password ||
      !confirmPassword ||
      !verificationCode
    ) {
      return res.status(404).json({
        message: "all fields are required!",
        success: false,
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        message: "passwords do not match!",
        success: false,
      });
    }

    const isCodeVerified = await ReferralCode.findOne({ verificationCode });

    if (isCodeVerified) {
      return res.status(404).json({
        message: "invalid code",
        success: false,
      });
    }

    const existingAdmin = await Admin.findOne({ email });

    if (existingAdmin) {
      return res.status(400).json({
        message: "already have an account!",
        success: false,
      });
    }

    await ReferralCode.findByIdAndDelete(isCodeVerified?._id);

    const newAdmin = new Admin({
      username,
      password,
      email,
    });
    await newAdmin.save();

    const token = generateToken(newAdmin._id);

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        user: newAdmin.toJSON(),
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

const login = async (req, res) => {
  try {
    const { password, email, emailCode } = req.body;

    if (!email || !password || !emailCode) {
      return res.status(404).json({
        message: "all fields are required!",
        success: false,
      });
    }

    const isCodeVerified = await ReferralCode.findOne({ emailCode });

    if (isCodeVerified) {
      return res.status(404).json({
        message: "invalid code",
        success: false,
      });
    }

    const admin = await Admin.findOne({ email });

    if (!admin) {
      return res.status(404).json({
        message: "invaild credentials!",
        success: false,
      });
    }

    const validPassword = await admin.comparePassword(password);

    if (!validPassword) {
      return res.status(404).json({
        message: "password do not matched!",
        success: false,
      });
    }

    await ReferralCode.findByIdAndDelete(isCodeVerified?._id);

    const token = generateToken(admin._id);

    res.status(201).json({
      success: true,
      message: `welcome back ${admin.username}`,
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

const updateProfile = async (req, res) => {
  try {
    const { bankName, walletId } = req.body;
    const { id: userId } = req.params;

    const user = await Admin.findById(userId);

    if (!user) {
      return res.status(404).json({
        message: "invalid user",
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
      message: "profile updated successfully!",
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
      message: "logout successfully",
      success: true,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
      success: false,
    });
  }
};

// NEW GET API - Get Admin Profile by ID
const getProfile = async (req, res) => {
  try {
    const { id: userId } = req.params;

    // Validate if userId is provided
    if (!userId) {
      return res.status(400).json({
        message: "User ID is required",
        success: false,
      });
    }

    // Find admin by ID and exclude password field
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
    // Handle invalid ObjectId format
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

export { signup, login, logout, updateProfile, getProfile };
