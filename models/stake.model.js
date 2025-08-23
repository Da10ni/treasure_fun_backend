
import mongoose from "mongoose";

// Stake Schema
const stakeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    productTitle: { type: String, required: true },
    stakeAmount: { type: Number, required: true, min: 0 },
    incomePercentage: { type: Number, required: true, min: 0 },
    profitAmount: { type: Number, required: true, min: 0 },
    handlingFee: { type: Number, required: true, min: 0 },
    duration: { type: Number, required: true, min: 1 },
    maturityDate: { type: Date, required: true },
    referredBy: { type: String, default: null },
    status: {
      type: String,
      enum: ["active", "completed", "cancelled"],
      default: "active",
    },
    attachment: { type: String, default: null },
  },
  {
    timestamps: true,
  }
);

// Stake Return Schema
const stakeReturnSchema = new mongoose.Schema(
  {
    stakeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Stake",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    originalAmount: { type: Number, required: true, min: 0 },
    profitAmount: { type: Number, required: true, min: 0 },
    totalReturnAmount: { type: Number, required: true, min: 0 },
    handlingFee: { type: Number, required: true, min: 0 },
    maturityDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ["pending", "completed"],
      default: "pending",
    },
    processedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
  }
);

// Create or get existing models
const Stake = mongoose.models.Stake || mongoose.model("Stake", stakeSchema);
const StakeReturn =
  mongoose.models.StakeReturn ||
  mongoose.model("StakeReturn", stakeReturnSchema);

export { Product, Stake, StakeReturn };
