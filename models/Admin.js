import mongoose from "mongoose";
import bcrypt from "bcrypt";
import speakeasy from "speakeasy";
import qrcode from "qrcode";
import { type } from "os";

const adminSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Username is required"],
      unique: true,
      trim: true,
      minlength: [3, "Username must be at least 3 characters long"],
      maxlength: [20, "Username cannot exceed 20 characters"],
      match: [
        /^[a-zA-Z0-9_]+$/,
        "Username can only contain letters, numbers, and underscores",
      ],
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      match: [/\S+@\S+\.\S+/, "Please enter a valid email address"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters long"],
    },
    walletId: {
      type: String,
    },
    bankName: {
      type: String,
    },
    // Google Authenticator fields
    totpSecret: {
      type: String,
      required: false, // Will be generated on first setup
    },
    isTotpEnabled: {
      type: Boolean,
      default: false,
    },
    totpSetupComplete: {
      type: Boolean,
      default: false,
    },
    networks: {
      bep20Id: {
        type: String,
      },
      bep20Img: {
        type: String,
      },
      trc20Id: {
        type: String,
      },
      trc20Img: {
        type: String,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
adminSchema.pre("save", async function (next) {
  // Only hash password if it's been modified
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Instance method to compare password
adminSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error("Password comparison failed");
  }
};

// Generate TOTP secret and QR code
adminSchema.methods.generateTotpSecret = function () {
  const secret = speakeasy.generateSecret({
    name: `Admin Panel - ${this.username}`,
    issuer: "Your App Name",
    length: 32,
  });

  this.totpSecret = secret.base32;
  return secret;
};

// Generate QR code for Google Authenticator
adminSchema.methods.generateQRCode = async function () {
  if (!this.totpSecret) {
    throw new Error("TOTP secret not found");
  }

  const otpauthURL = speakeasy.otpauthURL({
    secret: this.totpSecret,
    label: this.username,
    issuer: "Your App Name",
    encoding: "base32",
  });

  try {
    const qrCodeDataURL = await qrcode.toDataURL(otpauthURL);
    return qrCodeDataURL;
  } catch (error) {
    throw new Error("Failed to generate QR code");
  }
};

// Verify TOTP token
adminSchema.methods.verifyTotpToken = function (token) {
  if (!this.totpSecret) {
    return false;
  }

  return speakeasy.totp.verify({
    secret: this.totpSecret,
    encoding: "base32",
    token: token,
    window: 2, // Allow 2 steps before and after current time
  });
};

// Enable TOTP
adminSchema.methods.enableTotp = function (token) {
  if (!this.verifyTotpToken(token)) {
    return false;
  }

  this.isTotpEnabled = true;
  this.totpSetupComplete = true;
  return true;
};

// Disable TOTP
adminSchema.methods.disableTotp = function () {
  this.isTotpEnabled = false;
  this.totpSetupComplete = false;
  this.totpSecret = undefined;
};

// Static method to find user by username
adminSchema.statics.findByUsername = function (username) {
  return this.findOne({ username: username });
};

// Remove password and sensitive data from JSON output
adminSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  delete user.totpSecret; // Never expose the secret
  delete user.__v;
  return user;
};

export default mongoose.model("Admin", adminSchema);
