import mongoose from "mongoose";

const networkSchema = new mongoose.Schema(
  {
    bep20Id: {
      type: String,
      trim: true,
    },
    bep20Img: {
      type: String,
    },
    trc20Id: {
      type: String,
      trim: true,
    },
    trc20Img: {
      type: String,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Since there will be only one network config, we can add a unique constraint
networkSchema.index({ createdBy: 1 });

export default mongoose.model("Network", networkSchema);
