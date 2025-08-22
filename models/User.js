// // import mongoose from "mongoose";
// // import bcrypt from "bcrypt";

// // const userSchema = new mongoose.Schema(
// //   {
// //     username: {
// //       type: String,
// //       required: [true, "Username is required"],
// //       unique: true,
// //       trim: true,
// //       minlength: [3, "Username must be at least 3 characters long"],
// //       maxlength: [20, "Username cannot exceed 20 characters"],
// //       match: [
// //         /^[a-zA-Z0-9_]+$/,
// //         "Username can only contain letters, numbers, and underscores",
// //       ],
// //     },
// //     email: {
// //       type: String,
// //       required: false,
// //       unique: true,
// //       sparse: true,
// //       trim: true,
// //       lowercase: true,
// //       match: [/\S+@\S+\.\S+/, "Please enter a valid email address"],
// //     },
// //     password: {
// //       type: String,
// //       required: [true, "Password is required"],
// //       minlength: [6, "Password must be at least 6 characters long"],
// //     },
// //     mobileNo: {
// //       type: String,
// //       required: [true, "Mobile number is required"],
// //       unique: true,
// //       trim: true,
// //       match: [
// //         /^[0-9]{10,15}$/,
// //         "Please enter a valid mobile number (10-15 digits)",
// //       ],
// //     },
// //     isActive: {
// //       type: Boolean,
// //       default: true,
// //     },
// //     lastLogin: {
// //       type: Date,
// //       default: null,
// //     },
// //     // NEW: Referral system fields
// //     myReferralCode: {
// //       type: String,
// //       unique: true,
// //       required: true,
// //     },
// //     referredByCode: {
// //       type: String, // Store the referral code that was used to refer this user
// //       default: null,
// //     },
// //     referredByUser: {
// //       type: String,

// //     },
// //     referredUsers: [{
// //       type: mongoose.Schema.Types.ObjectId,
// //       ref: 'User'
// //     }],
// //     referralCount: {
// //       type: Number,
// //       default: 0,
// //     },
// //     walletId: {
// //       type: String,
// //       default: null
// //     },
// //     bankName: {
// //       type: String,
// //       default: null
// //     },
// //     walletBalance: {
// //       type: Number,
// //       default: 10000000000
// //     },
// //     tuftWalletBalance: {
// //       type: Number,
// //       default: 0
// //     },
// //     order: {
// //       type: Number,
// //       default: 0
// //     },
// //     rejected: {
// //       type: Number,
// //       default: 0
// //     },
// //     buy: {
// //       type: Number,
// //       default: 0
// //     },
// //     sell: {
// //       type: Number,
// //       default: 0
// //     },
// //   },
// //   {
// //     timestamps: true,
// //   }
// // );

// // const referralCodeSchema = new mongoose.Schema({
// //   email: {
// //     type: String,
// //     required: true,
// //     lowercase: true,
// //   },
// //   code: {
// //     type: String,
// //     required: true,
// //   },
// //   createdAt: {
// //     type: Date,
// //     default: Date.now,
// //     expires: 600,
// //   },
// // });

// // const passwordResetSchema = new mongoose.Schema({
// //   email: {
// //     type: String,
// //     required: true,
// //     lowercase: true,
// //   },
// //   code: {
// //     type: String,
// //     required: true,
// //   },
// //   userId: {
// //     type: mongoose.Schema.Types.ObjectId,
// //     ref: 'User',
// //     required: true,
// //   },
// //   createdAt: {
// //     type: Date,
// //     default: Date.now,
// //     expires: 600, // 10 minutes
// //   },
// // });

// // export const PasswordResetCode = mongoose.model("PasswordResetCode", passwordResetSchema);
// // export const ReferralCode = mongoose.model("ReferralCode", referralCodeSchema);

// // userSchema.index({ username: 1 });
// // userSchema.index({ mobileNo: 1 });
// // userSchema.index({ myReferralCode: 1 });
// // userSchema.index({ referredByCode: 1 });

// // // Hash password before saving
// // userSchema.pre("save", async function (next) {
// //   // Only hash password if it's been modified
// //   if (!this.isModified("password")) return next();

// //   try {
// //     const salt = await bcrypt.genSalt(12);
// //     this.password = await bcrypt.hash(this.password, salt);
// //     next();
// //   } catch (error) {
// //     next(error);
// //   }
// // });

// // // Instance method to compare password
// // userSchema.methods.comparePassword = async function (candidatePassword) {
// //   try {
// //     return await bcrypt.compare(candidatePassword, this.password);
// //   } catch (error) {
// //     throw new Error("Password comparison failed");
// //   }
// // };

// // // Static method to find user by username
// // userSchema.statics.findByUsername = function (username) {
// //   return this.findOne({ username: username });
// // };

// // // NEW: Static method to find user by referral code
// // userSchema.statics.findByReferralCode = function (referralCode) {
// //   return this.findOne({ myReferralCode: referralCode });
// // };

// // // Remove password from JSON output
// // userSchema.methods.toJSON = function () {
// //   const user = this.toObject();
// //   delete user.password;
// //   delete user.__v;
// //   return user;
// // };
// // 7
// // export default mongoose.model("User", userSchema);

// import mongoose from "mongoose";
// import bcrypt from "bcrypt";

// const userSchema = new mongoose.Schema(
//   {
//     username: {
//       type: String,
//       required: [true, "Username is required"],
//       unique: true,
//       trim: true,
//       minlength: [3, "Username must be at least 3 characters long"],
//       maxlength: [20, "Username cannot exceed 20 characters"],
//       match: [
//         /^[a-zA-Z0-9_]+$/,
//         "Username can only contain letters, numbers, and underscores",
//       ],
//     },
//     email: {
//       type: String,
//       required: false,
//       unique: true,
//       sparse: true,
//       trim: true,
//       lowercase: true,
//       match: [/\S+@\S+\.\S+/, "Please enter a valid email address"],
//     },
//     password: {
//       type: String,
//       required: [true, "Password is required"],
//       minlength: [6, "Password must be at least 6 characters long"],
//     },
//     mobileNo: {
//       type: String,
//       required: [true, "Mobile number is required"],
//       unique: true,
//       trim: true,
//       match: [
//         /^[0-9]{10,15}$/,
//         "Please enter a valid mobile number (10-15 digits)",
//       ],
//     },
//     isActive: {
//       type: Boolean,
//       default: true,
//     },
//     lastLogin: {
//       type: Date,
//       default: null,
//     },

//     // Referral system fields
//     myReferralCode: {
//       type: String,
//       unique: true,
//       required: true,
//     },
//     referredByCode: {
//       type: String,
//       default: null,
//     },
//     referredByUser: {
//       type: String,
//     },
//     referredUsers: [{
//       type: mongoose.Schema.Types.ObjectId,
//       ref: 'User'
//     }],
//     referralCount: {
//       type: Number,
//       default: 0,
//     },

//     // Wallets
//     walletId: {
//       type: String, // TRC-20
//       default: null,
//     },
//     BEP: {
//       type: String, // ✅ BEP-20 wallet
//       default: null,
//     },

//     // Financials
//     walletBalance: {
//       type: Number,
//       default: 10000000000,
//     },
//     tuftWalletBalance: {
//       type: Number,
//       default: 0,
//     },

//     // Order Stats
//     order: {
//       type: Number,
//       default: 0,
//     },
//     rejected: {
//       type: Number,
//       default: 0,
//     },
//     buy: {
//       type: Number,
//       default: 0,
//     },
//     sell: {
//       type: Number,
//       default: 0,
//     },
//   },
//   {
//     timestamps: true,
//   }
// );

// const referralCodeSchema = new mongoose.Schema({
//   email: {
//     type: String,
//     required: true,
//     lowercase: true,
//   },
//   code: {
//     type: String,
//     required: true,
//   },
//   createdAt: {
//     type: Date,
//     default: Date.now,
//     expires: 600,
//   },
// });

// const passwordResetSchema = new mongoose.Schema({
//   email: {
//     type: String,
//     required: true,
//     lowercase: true,
//   },
//   code: {
//     type: String,
//     required: true,
//   },
//   userId: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'User',
//     required: true,
//   },
//   createdAt: {
//     type: Date,
//     default: Date.now,
//     expires: 600,
//   },
// });

// export const PasswordResetCode = mongoose.model("PasswordResetCode", passwordResetSchema);
// export const ReferralCode = mongoose.model("ReferralCode", referralCodeSchema);

// userSchema.index({ username: 1 });
// userSchema.index({ mobileNo: 1 });
// userSchema.index({ myReferralCode: 1 });
// userSchema.index({ referredByCode: 1 });

// // Hash password before saving
// userSchema.pre("save", async function (next) {
//   if (!this.isModified("password")) return next();

//   try {
//     const salt = await bcrypt.genSalt(12);
//     this.password = await bcrypt.hash(this.password, salt);
//     next();
//   } catch (error) {
//     next(error);
//   }
// });

// // Instance method to compare password
// userSchema.methods.comparePassword = async function (candidatePassword) {
//   try {
//     return await bcrypt.compare(candidatePassword, this.password);
//   } catch (error) {
//     throw new Error("Password comparison failed");
//   }
// };

// // Static method to find user by username
// userSchema.statics.findByUsername = function (username) {
//   return this.findOne({ username });
// };

// // Static method to find user by referral code
// userSchema.statics.findByReferralCode = function (referralCode) {
//   return this.findOne({ myReferralCode: referralCode });
// };

// // Remove password and version from JSON
// userSchema.methods.toJSON = function () {
//   const user = this.toObject();
//   delete user.password;
//   delete user.__v;
//   return user;
// };

// export default mongoose.model("User", userSchema);

import mongoose from "mongoose";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema(
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
      required: false,
      unique: true,
      sparse: true,
      trim: true,
      lowercase: true,
      match: [/\S+@\S+\.\S+/, "Please enter a valid email address"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters long"],
    },
    mobileNo: {
      type: String,
      required: [true, "Mobile number is required"],
      unique: true,
      trim: true,
      match: [
        /^[0-9]{10,15}$/,
        "Please enter a valid mobile number (10-15 digits)",
      ],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
      default: null,
    },

    // Referral system fields
    myReferralCode: {
      type: String,
      unique: true,
      required: true,
    },
    referredByCode: {
      type: String,
      default: null,
    },
    referredByUser: {
      type: String,
    },
    referredUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    referralCount: {
      type: Number,
      default: 0,
    },

    // Wallets
    walletId: {
      type: String, // TRC-20
      default: null,
    },
    BEP: {
      type: String, // BEP-20 wallet
      default: null,
    },
    // Financials
    walletBalance: {
      type: Number,
      default: 0,
    },
    tuftWalletBalance: {
      type: Number,
      default: 0,
    },

    // Order Stats
    order: {
      type: Number,
      default: 0,
    },
    rejected: {
      type: Number,
      default: 0,
    },
    buy: {
      type: Number,
      default: 0,
    },
    sell: {
      type: Number,
      default: 0,
    },
    levels: {
      type: Number,
      default: 1,
    },
    isFreezed: {
      type: Boolean,
      default: false,
    },
    freezeTimestamp: {
      type: Date,
      default: null, // When the freeze started
    },

    reserve: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastReserveTime: {
      type: Date,
      default: null,
    },
    reserveCooldownExpires: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// 🔥 NEW: Instance method to check if user should be unfrozen
userSchema.methods.checkAndUnfreeze = function () {
  if (this.isFreezed && this.freezeTimestamp) {
    const currentTime = new Date();
    const freezeTime = new Date(this.freezeTimestamp);
    const timePassed = currentTime - freezeTime;
    const seventyTwoHours = 72 * 60 * 60 * 1000; // 72 hours in milliseconds

    if (timePassed >= seventyTwoHours) {
      // Freeze period has ended
      this.isFreezed = false;
      this.freezeTimestamp = undefined;
      return true; // User was unfrozen
    }
  }
  return false; // User is still frozen or wasn't frozen
};

// 🔥 NEW: Instance method to get remaining freeze time
userSchema.methods.getFreezeTimeRemaining = function () {
  if (!this.isFreezed || !this.freezeTimestamp) {
    return 0;
  }

  const currentTime = new Date();
  const freezeTime = new Date(this.freezeTimestamp);
  const timePassed = currentTime - freezeTime;
  const seventyTwoHours = 72 * 60 * 60 * 1000; // 72 hours in milliseconds
  const timeRemaining = seventyTwoHours - timePassed;

  return timeRemaining > 0 ? timeRemaining : 0;
};

const referralCodeSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
  },
  code: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 600,
  },
});

const passwordResetSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
  },
  code: {
    type: String,
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 600,
  },
});

export const PasswordResetCode = mongoose.model(
  "PasswordResetCode",
  passwordResetSchema
);
export const ReferralCode = mongoose.model("ReferralCode", referralCodeSchema);

userSchema.index({ username: 1 });
userSchema.index({ mobileNo: 1 });
userSchema.index({ myReferralCode: 1 });
userSchema.index({ referredByCode: 1 });
userSchema.index({ isFreezed: 1, freezeTimestamp: 1 }); // 🔥 NEW: Index for freeze queries
userSchema.index({ reserveCooldownExpires: 1 });

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to check if user can reserve
userSchema.methods.canReserve = function () {
  if (!this.reserveCooldownExpires) return true;
  return new Date() >= this.reserveCooldownExpires;
};

// Method to get remaining cooldown time
userSchema.methods.getRemainingCooldown = function () {
  if (!this.reserveCooldownExpires) return 0;
  const now = new Date();
  return Math.max(0, this.reserveCooldownExpires.getTime() - now.getTime());
};

// Instance method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error("Password comparison failed");
  }
};

// Static method to find user by username
userSchema.statics.findByUsername = function (username) {
  return this.findOne({ username });
};

// Static method to find user by referral code
userSchema.statics.findByReferralCode = function (referralCode) {
  return this.findOne({ myReferralCode: referralCode });
};

// Remove password and version from JSON
userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  delete user.__v;
  return user;
};

export default mongoose.model("User", userSchema);
