import jwt from "jsonwebtoken";
import User from "../models/User.js";

// Generate random email verification code (6-digit)
export const generateEmailVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit code
};

// Generate unique referral code for users (8-character alphanumeric)
const generateUserReferralCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Generate unique referral code with retry logic
export const generateUniqueReferralCode = async (maxRetries = 5) => {
  let code;
  let attempts = 0;

  do {
    code = generateUserReferralCode();
    attempts++;

    if (attempts > maxRetries) {
      throw new Error('Unable to generate unique referral code');
    }

    const existingUser = await User.findByReferralCode(code);
    if (!existingUser) {
      return code;
    }
  } while (attempts <= maxRetries);
};

// Validation functions
export const validateSignupInput = (
  username,
  email,
  password,
  confirmPassword,
  mobileNo,
  emailVerificationCode,
  referredByCode // Optional referral code
) => {
  const errors = [];

  // Username validation
  if (!username || !username.trim()) {
    errors.push({ field: "username", message: "Username is required" });
  } else if (username.length < 3 || username.length > 20) {
    errors.push({
      field: "username",
      message: "Username must be between 3 and 20 characters",
    });
  } else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    errors.push({
      field: "username",
      message: "Username can only contain letters, numbers, and underscores",
    });
  }

  // Email validation
  if (!email || !email.trim()) {
    errors.push({ field: "email", message: "Email is required" });
  } else if (!/\S+@\S+\.\S+/.test(email)) {
    errors.push({
      field: "email",
      message: "Please enter a valid email address",
    });
  }

  // Password validation
  if (!password || !password.trim()) {
    errors.push({ field: "password", message: "Password is required" });
  } else if (password.length < 6) {
    errors.push({
      field: "password",
      message: "Password must be at least 6 characters",
    });
  }

  // Confirm password validation
  if (!confirmPassword || !confirmPassword.trim()) {
    errors.push({
      field: "confirmPassword",
      message: "Confirm password is required",
    });
  } else if (password !== confirmPassword) {
    errors.push({
      field: "confirmPassword",
      message: "Passwords do not match",
    });
  }

  // Mobile number validation
  if (!mobileNo || !mobileNo.trim()) {
    errors.push({ field: "mobileNo", message: "Mobile number is required" });
  } else if (!/^[0-9]{10,15}$/.test(mobileNo.trim())) {
    errors.push({
      field: "mobileNo",
      message: "Please enter a valid mobile number (10-15 digits)",
    });
  }

  // Email verification code validation
  if (!emailVerificationCode || !emailVerificationCode.trim()) {
    errors.push({
      field: "emailVerificationCode",
      message: "Email verification code is required",
    });
  } else if (!/^[0-9]{6}$/.test(emailVerificationCode.trim())) {
    errors.push({
      field: "emailVerificationCode",
      message: "Email verification code must be 6 digits",
    });
  }

  // Referral code validation (optional)
  if (referredByCode && referredByCode.trim()) {
    if (!/^[A-Z0-9]{8}$/.test(referredByCode.trim())) {
      errors.push({
        field: "referredByCode",
        message: "Referral code must be 8 characters (letters and numbers)",
      });
    }
  }

  return errors;
};

export const validateLoginInput = (username, password) => {
  const errors = [];

  if (!username || !username.trim()) {
    errors.push({ field: "username", message: "Username is required" });
  }

  if (!password || !password.trim()) {
    errors.push({ field: "password", message: "Password is required" });
  }

  return errors;
};

// Generate JWT token
export const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: "24h",
  });
};
