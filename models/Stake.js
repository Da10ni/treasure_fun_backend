import mongoose from "mongoose";

const stakeSchema = new mongoose.Schema(
  {
    stakeId: {
      type: String,
      required: [true, "Stake ID is required"],
      unique: true,
      trim: true,
      match: [/^Stake_\d+$/, "Stake ID must be in format: Stake_XXXXXX"],
    },
    contractAddress: {
      type: String,
      required: [true, "Contract address is required"],
      trim: true,
      match: [
        /^0x[a-fA-F0-9]{40}$/,
        "Please enter a valid Ethereum contract address",
      ],
    },
    owner: {
      type: String,
      required: [true, "Owner is required"],
      trim: true,
      minlength: [2, "Owner name must be at least 2 characters"],
      maxlength: [100, "Owner name cannot exceed 100 characters"],
    },
    price: {
      amount: {
        type: Number,
        required: [true, "Price amount is required"],
        min: [0, "Price cannot be negative"],
      },
      currency: {
        type: String,
        required: [true, "Price currency is required"],
        enum: ["USDT", "USDC", "ETH", "BTC", "MATIC"],
        default: "USDT",
      },
    },
    resaleProfit: {
      amount: {
        type: Number,
        required: true,
        min: [0, "Resale profit cannot be negative"],
        default: 0,
      },
      currency: {
        type: String,
        required: true,
        enum: ["USDT", "USDC", "ETH", "BTC", "MATIC"],
        default: "USDT",
      },
    },
    chain: {
      type: String,
      required: [true, "Chain is required"],
      enum: ["Polygon", "Ethereum", "BSC", "Arbitrum", "Optimism", "Avalanche"],
      default: "Polygon",
    },
    tokenId: {
      type: String,
      required: [true, "Token ID is required"],
      trim: true,
    },
    timeZone: {
      type: String,
      required: [true, "Time zone is required"],
      trim: true,
      default: "UTC",
    },
    status: {
      type: String,
      enum: ["active", "sold", "pending", "cancelled"],
      default: "active",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    metadata: {
      description: String,
      imageUrl: String,
      externalUrl: String,
      attributes: [
        {
          trait_type: String,
          value: mongoose.Schema.Types.Mixed,
        },
      ],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Create indexes for better performance
stakeSchema.index({ stakeId: 1 });
stakeSchema.index({ contractAddress: 1 });
stakeSchema.index({ owner: 1 });
stakeSchema.index({ chain: 1 });
stakeSchema.index({ status: 1 });
stakeSchema.index({ createdBy: 1 });
stakeSchema.index({ createdAt: -1 });

// Virtual for formatted price
stakeSchema.virtual("formattedPrice").get(function () {
  return `${this.price.currency}${this.price.amount}`;
});

// Virtual for formatted resale profit
stakeSchema.virtual("formattedResaleProfit").get(function () {
  return `${this.resaleProfit.currency}${this.resaleProfit.amount}`;
});

// Virtual for profit margin percentage
stakeSchema.virtual("profitMargin").get(function () {
  if (this.price.amount === 0) return 0;
  return ((this.resaleProfit.amount / this.price.amount) * 100).toFixed(2);
});

// Static method to generate next stake ID
stakeSchema.statics.generateStakeId = async function () {
  const lastStake = await this.findOne({}, {}, { sort: { createdAt: -1 } });

  if (!lastStake) {
    return "Stake_2616314";
  }

  const lastIdNumber = parseInt(lastStake.stakeId.split("_")[1]);
  const nextIdNumber = lastIdNumber + 1;

  return `Stake_${nextIdNumber}`;
};

// Static method to find by stake ID
stakeSchema.statics.findByStakeId = function (stakeId) {
  return this.findOne({ stakeId });
};

// Instance method to update status
stakeSchema.methods.updateStatus = function (newStatus) {
  this.status = newStatus;
  return this.save();
};

// Instance method to calculate total value
stakeSchema.methods.getTotalValue = function () {
  return this.price.amount + this.resaleProfit.amount;
};

// Pre-save middleware to auto-generate stake ID if not provided
stakeSchema.pre("save", async function (next) {
  if (this.isNew && !this.stakeId) {
    this.stakeId = await this.constructor.generateStakeId();
  }
  next();
});

// Pre-save middleware to format contract address
stakeSchema.pre("save", function (next) {
  if (this.contractAddress) {
    this.contractAddress = this.contractAddress.toLowerCase();
  }
  next();
});

export default mongoose.model("Stake", stakeSchema);
