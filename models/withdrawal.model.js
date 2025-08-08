// import mongoose from 'mongoose';

// const withdrawalSchema = new mongoose.Schema({
//     userId: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: 'User',
//         required: true
//     },
//     amount: {
//         type: Number,
//         required: true,
//         min: 0
//     },
//     walletId: {
//         type: String,
//         required: true
//     },
//     status: {
//         type: String,
//         enum: ['processing', 'completed', 'rejected'],
//         default: 'processing'
//     },
//     requestDate: {
//         type: Date,
//         default: Date.now
//     },
//     processedDate: {
//         type: Date
//     },
// }, {
//     timestamps: true
// });

// // Virtual for user details
// withdrawalSchema.virtual('userDetails', {
//     ref: 'User',
//     localField: 'userId',
//     foreignField: '_id',
//     justOne: true
// });

// // Virtual for product details
// withdrawalSchema.virtual('productDetails', {
//     ref: 'Product',
//     localField: 'productId',
//     foreignField: '_id',
//     justOne: true
// });

// // Ensure virtual fields are serialized
// withdrawalSchema.set('toJSON', { virtuals: true });
// withdrawalSchema.set('toObject', { virtuals: true });

// export const Withdrawal = mongoose.model('Withdrawal', withdrawalSchema);

import mongoose from 'mongoose';

const withdrawalSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  walletType: {
    type: String,
    enum: ['TRC-20', 'BEP-20'],
    required: true
  },
  walletAddress: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['processing', 'completed', 'rejected'],
    default: 'processing'
  },
  requestDate: {
    type: Date,
    default: Date.now
  },
  processedDate: {
    type: Date
  },
  rejectionReason: {
    type: String
  }
}, {
  timestamps: true
});

// Virtual for user details
withdrawalSchema.virtual('userDetails', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true
});

// Ensure virtual fields are serialized
withdrawalSchema.set('toJSON', { virtuals: true });
withdrawalSchema.set('toObject', { virtuals: true });

export const Withdrawal = mongoose.model('Withdrawal', withdrawalSchema);