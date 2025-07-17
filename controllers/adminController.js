import { generateToken } from "../methods/methods.js";
import User, { ReferralCode } from "../models/User";

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

    if (!isCodeVerified) {
      return res.status(404).json({
        message: "invalid code",
        success: false,
      });
    }

    const existingAdmin = await User.findOne({ email });

    if (existingAdmin) {
      return res.status(400).json({
        message: "already have an account!",
        success: false,
      });
    }

    await ReferralCode.findByIdAndDelete(isCodeVerified?._id);

    const newAdmin = new User.create({
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
  } catch (error) {
    res.status(500).json({
      message: error.message,
      success: false,
    });
  }
};

export { signup, login };
