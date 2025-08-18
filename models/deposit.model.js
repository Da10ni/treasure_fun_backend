// // =============================================
// // 1. DEPOSIT MODEL (models/Deposit.js)
// // =============================================

// import mongoose from 'mongoose';

// const depositSchema = new mongoose.Schema({
//   userId: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'User',
//     required: true
//   },
//   productId: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'Product', 
//     required: true
//   },
//   attachment: {
//       type: String,
//       required: true
//   },
//   amount: {
//     type: Number,
//     required: false
//   },
//   status: {
//     type: String,
//     enum: ['pending', 'approved', 'rejected'],
//     default: 'pending'
//   },
//   createdAt: {
//     type: Date,
//     default: Date.now
//   },
//   updatedAt: {
//     type: Date,
//     default: Date.now
//   },
//   referredBy: {
//     type: String,
//   }
// });

// // Update the updatedAt field before saving
// depositSchema.pre('save', function(next) {
//   this.updatedAt = Date.now();
//   next();
// });

// const Deposit = mongoose.model('Deposit', depositSchema);
// export default Deposit;


import mongoose from 'mongoose';

const depositSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product', 
    required: true
  },
  attachment: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: false
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  // 🔥 NEW FIELDS for income tracking
  incomeStartDate: {
    type: Date,
    default: null // Set when deposit is approved
  },
  incomeEndDate: {
    type: Date,
    default: null // Set when deposit is approved (startDate + product duration)
  },
  isIncomeActive: {
    type: Boolean,
    default: false // True when approved, false when expired
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
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
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
  }
});

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

const Deposit = mongoose.model('Deposit', depositSchema);
export default Deposit;