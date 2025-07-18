// =============================================
// 1. DEPOSIT MODEL (models/Deposit.js)
// =============================================

import mongoose from 'mongoose';

const depositSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // or 'Admin' - jo bhi tumhara user model hai
    required: true
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product', // tumhara product model
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
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  referredBy: {
    type: String,
  }
});

// Update the updatedAt field before saving
depositSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Deposit = mongoose.model('Deposit', depositSchema);
export default Deposit;