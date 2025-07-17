import { generateToken } from "../methods/methods.js";
import User, { ReferralCode } from "../models/User.js";

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

    const isCodeVerified = await ReferralCode.findOne({ code:verificationCode, email });

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

    await ReferralCode.findByIdAndDelete({ id: isCodeVerified?._id });

    const token = generateToken(existingAdmin._id);

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        user: user.toJSON(),
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
  } catch (error) {
    res.status(500).json({
      message: error.message,
      success: false,
    });
  }
};

export { signup, login };
