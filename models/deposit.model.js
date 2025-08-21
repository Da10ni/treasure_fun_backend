import mongoose from 'mongoose';

const depositSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // 🔥 CHANGED: Network type instead of productId
  networkType: {
    type: String,
    enum: ['TRC20', 'BEP20'],
    required: true
  },
  
  attachment: {
    type: String,
    required: true
  },
  
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  
  // 🔥 Network specific fields
  depositAddress: {
    type: String,
    default: null
  },
  
  networkFee: {
    type: Number,
    default: 0
  },
  
  networkDescription: {
    type: String,
    default: null
  },
  
  transactionHash: {
    type: String,
    default: null // Can be added later for tracking
  },
  
  // 🔥 Income tracking fields
  incomeStartDate: {
    type: Date,
    default: null // Set when deposit is approved
  },
  
  incomeEndDate: {
    type: Date,
    default: null // Set when deposit is approved (startDate + duration)
  },
  
  isIncomeActive: {
    type: Boolean,
    default: false // True when approved, false when expired
  },
  
  dailyIncomeRate: {
    type: Number,
    default: 0 // Percentage or fixed amount per day
  },
  
  dailyIncomeAmount: {
    type: Number,
    default: 0 // Calculated when approved
  },
  
  totalIncomeEarned: {
    type: Number,
    default: 0 // Track total income earned so far
  },
  
  lastIncomeDate: {
    type: Date,
    default: null // Track last date income was credited
  },
  
  estimatedDuration: {
    type: Number,
    default: 0 // Duration in days
  },
  
  // Referral tracking
  referredByCode: {
    type: String,
  },
  
  // Approval/Rejection tracking
  approvedBy: {
    type: String,
  },
  
  approvedAt: {
    type: Date,
  },
  
  rejectedBy: {
    type: String,
  },
  
  rejectedAt: {
    type: Date,
  },
  
  rejectionReason: {
    type: String,
  },
  
  notes: {
    type: String,
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for better query performance
depositSchema.index({ userId: 1, networkType: 1 });
depositSchema.index({ status: 1 });
depositSchema.index({ isIncomeActive: 1 });
depositSchema.index({ createdAt: -1 });

// Update the updatedAt field before saving
depositSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// 🔥 Method to check if income period has expired
depositSchema.methods.isIncomeExpired = function() {
  if (!this.incomeEndDate) return false;
  return new Date() > this.incomeEndDate;
};

// 🔥 Method to calculate remaining days
depositSchema.methods.getRemainingDays = function() {
  if (!this.incomeEndDate || this.isIncomeExpired()) return 0;
  const today = new Date();
  const diffTime = this.incomeEndDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
};

// 🔥 Method to calculate total expected income
depositSchema.methods.getTotalExpectedIncome = function() {
  if (!this.dailyIncomeAmount || !this.estimatedDuration) return 0;
  return this.dailyIncomeAmount * this.estimatedDuration;
};

// 🔥 Method to calculate progress percentage
depositSchema.methods.getProgressPercentage = function() {
  if (!this.totalIncomeEarned || !this.getTotalExpectedIncome()) return 0;
  const percentage = (this.totalIncomeEarned / this.getTotalExpectedIncome()) * 100;
  return Math.min(100, Math.round(percentage));
};

// 🔥 Virtual field for network display name
depositSchema.virtual('networkDisplayName').get(function() {
  const networkNames = {
    'TRC20': 'TRON Network (TRC-20)',
    'BEP20': 'BNB Smart Chain (BEP-20)'
  };
  return networkNames[this.networkType] || this.networkType;
});

// 🔥 Virtual field for minimum deposit
depositSchema.virtual('minDeposit').get(function() {
  const minDeposits = {
    'TRC20': 50,
    'BEP20': 5
  };
  return minDeposits[this.networkType] || 0;
});

// Include virtuals in JSON output
depositSchema.set('toJSON', { virtuals: true });
depositSchema.set('toObject', { virtuals: true });

const Deposit = mongoose.model('Deposit', depositSchema);
export default Deposit;