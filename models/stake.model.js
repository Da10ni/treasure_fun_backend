import mongoose from "mongoose";

const stakeSchema = mongoose.Schema(
  {
    productId: {
      type: mongoose.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    username: {
      type: mongoose.Types.ObjectId,
      ref: "User",
      required: true,
    },
    paymentImage: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      anum: ["reject", "approve", "pending"],
      default: "pending",
    },
    amount: {
      type: String,
    },
    quantity: {
      type: Number,
    },
  },
  { timestamps: true }
);

export const stakeModel =
  mongoose.models.Stakes || mongoose.model("Stake", stakeSchema);
