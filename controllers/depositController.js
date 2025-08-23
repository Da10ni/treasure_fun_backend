// // import Deposit from '../models/deposit.model.js';
// import { productModel as Product } from '../models/Product.js';
// // import { referralModel } from '../models/Referral.modal.js';
// // import User from '../models/User.js';
// // import { uploadToCloudinary, deleteFromCloudinary } from '../services/cloudinaryService.js';

// // // =============================================
// // // CREATE NEW DEPOSIT (with file upload)
// // // =============================================
// // export const createDeposit = async (req, res) => {
// //   try {
// //     const {
// //       userId,
// //       productId,
// //       amount,
// //       referredByCode
// //     } = req.body;

// //     console.log('📝 Creating new deposit:', { userId, productId, amount });

// //     // Check if file is uploaded
// //     if (!req.file) {
// //       return res.status(400).json({
// //         success: false,
// //         message: 'Deposit verification image is required'
// //       });
// //     }

// //     // Validate required fields
// //     if (!userId || !productId) {
// //       return res.status(400).json({
// //         success: false,
// //         message: 'Missing required fields: userId and productId are required'
// //       });
// //     }

// //     // Verify user exists
// //     const user = await User.findById(userId);
// //     if (!user) {
// //       return res.status(404).json({
// //         success: false,
// //         message: 'User not found'
// //       });
// //     }

// //     // Verify product exists
// //     const product = await Product.findById(productId);
// //     if (!product) {
// //       return res.status(404).json({
// //         success: false,
// //         message: 'Product not found'
// //       });
// //     }

// //     // Validate amount is within product price range
// //     if (amount) {
// //       if (amount < product.priceRange.min || amount > product.priceRange.max) {
// //         return res.status(400).json({
// //           success: false,
// //           message: `Amount must be between ${product.priceRange.min} and ${product.priceRange.max}`
// //         });
// //       }
// //     }

// //     // Upload image to Cloudinary
// //     console.log('📤 Uploading image to Cloudinary...');
// //     const uploadResult = await uploadToCloudinary(req.file, 'deposits');

// //     // Create new deposit - Amount wallet me add NAHI hogi until approved
// //     const newDeposit = new Deposit({
// //       userId,
// //       productId,
// //       attachment: uploadResult.url,
// //       amount: amount || product.priceRange.min,
// //       referredByCode,
// //       status: 'pending' // ✅ Pending state - wallet me amount add nahi hui
// //     });

// //     await newDeposit.save();
// //     console.log('✅ Deposit created with pending status - NO wallet update yet');

// //     // 🔥 INCREMENT USER'S DEPOSIT COUNT
// //     await User.findByIdAndUpdate(
// //       userId,
// //       { $inc: { order: 1 } }, // depositCount ko 1 se increase kar do
// //       { new: true }
// //     );
// //     console.log('📊 User deposit count incremented');

// //     // Get the created deposit with populated fields
// //     const createdDeposit = await Deposit.findById(newDeposit._id)
// //       .populate('userId', 'username name email phone tuftWalletBalance depositCount') // depositCount bhi include kar diya
// //       .populate('productId', 'title image status priceRange income handlingFee');

// //     res.status(201).json({
// //       success: true,
// //       message: 'Deposit created successfully and is pending approval',
// //       data: createdDeposit,
// //       note: 'Amount will be added to wallet after admin approval'
// //     });

// //   } catch (error) {
// //     console.error('❌ Error creating deposit:', error);

// //     if (error.code === 11000) {
// //       return res.status(400).json({
// //         success: false,
// //         message: 'Duplicate deposit detected'
// //       });
// //     }

// //     res.status(500).json({
// //       success: false,
// //       message: 'Error creating deposit',
// //       error: error.message
// //     });
// //   }
// // };

// // // =============================================
// // // APPROVE DEPOSIT - MAIN WALLET UPDATE LOGIC
// // // =============================================
// // export const approveDeposit = async (req, res) => {
// //   try {
// //     const { depositId } = req.params;
// //     const { approvedBy, notes } = req.body;

// //     console.log(`🔍 Processing deposit approval for ID: ${depositId}`);

// //     // Find the deposit
// //     const deposit = await Deposit.findById(depositId);
// //     if (!deposit) {
// //       return res.status(404).json({
// //         success: false,
// //         message: 'Deposit not found'
// //       });
// //     }

// //     // Check if deposit is already processed
// //     if (deposit.status !== 'pending') {
// //       return res.status(400).json({
// //         success: false,
// //         message: `Deposit is already ${deposit.status}. Cannot approve.`
// //       });
// //     }

// //     // Find the user who made the deposit
// //     const currentUser = await User.findById(deposit.userId);
// //     if (!currentUser) {
// //       return res.status(404).json({
// //         success: false,
// //         message: 'User not found'
// //       });
// //     }

// //     // ✅ STEP 1: Add deposit amount to user's WALLET BALANCE (not tuftWalletBalance)
// //     console.log(`💰 Adding deposit amount ${deposit.amount} to user ${currentUser.username}'s walletBalance`);

// //     const previousWalletBalance = currentUser.walletBalance || 0;
// //     currentUser.walletBalance = previousWalletBalance + deposit.amount;

// //     // 🔥 INCREMENT USER'S BUY COUNT
// //     currentUser.buy = (currentUser.buy || 0) + 1;

// //     await currentUser.save();

// //     console.log(`✅ User wallet updated: walletBalance ${previousWalletBalance} → ${currentUser.walletBalance}`);
// //     console.log(`📊 User buy count incremented to: ${currentUser.buy}`);

// //     // ✅ STEP 2: Handle referral bonus (REFERRER ko bonus milega, current user ko nahi)
// //     let referralBonusInfo = null;

// //     try {
// //       // Check if current user was referred by someone
// //       if (currentUser.referredByCode) {
// //         console.log(`🔍 Current user ${currentUser.username} was referred with code: ${currentUser.referredByCode}`);

// //         // Find the REFERRER by their referral code (using myReferralCode field)
// //         const referrer = await User.findOne({ myReferralCode: currentUser.referredByCode });

// //         if (referrer) {
// //           console.log(`👤 Found REFERRER: ${referrer.username} (who referred ${currentUser.username})`);

// //           // Get latest referral settings from database
// //           const referralSettings = await referralModel.findOne().sort({ createdAt: -1 });

// //           if (referralSettings && referralSettings.percentage > 0) {
// //             // Calculate bonus based on percentage from database
// //             const bonusPercentage = referralSettings.percentage / 100;
// //             const bonusAmount = deposit.amount * bonusPercentage;

// //             // ✅ IMPORTANT: Update REFERRER's TUFT wallet balance (referral bonus goes here)
// //             const referrerPreviousTuftBalance = referrer.tuftWalletBalance || 0;
// //             referrer.tuftWalletBalance = referrerPreviousTuftBalance + bonusAmount;

// //             // Update referrer's referral count and add to referred users array
// //             if (!referrer.referredUsers.includes(currentUser._id)) {
// //               referrer.referredUsers.push(currentUser._id);
// //               referrer.referralCount = (referrer.referralCount || 0) + 1;
// //             }

// //             await referrer.save();

// //             referralBonusInfo = {
// //               referrerName: referrer.username,
// //               referrerCode: referrer.myReferralCode,
// //               bonusPercentage: referralSettings.percentage,
// //               bonusAmount: bonusAmount,
// //               referrerPreviousTuftBalance: referrerPreviousTuftBalance,
// //               referrerNewTuftBalance: referrer.tuftWalletBalance
// //             };

// //           } else {
// //             console.log('⚠️  No active referral settings found or percentage is 0');
// //           }
// //         } else {
// //           console.log(`❌ Referrer with code ${currentUser.referredByCode} not found`);
// //         }
// //       } else {
// //         console.log(`ℹ️  User ${currentUser.username} was not referred by anyone - no referral bonus to process`);
// //       }
// //     } catch (referralError) {
// //       console.error('❌ Error processing referral bonus:', referralError);
// //       // Don't fail the entire deposit approval if referral bonus fails
// //     }

// //     // ✅ STEP 3: Update deposit status to approved
// //     deposit.status = 'approved';
// //     deposit.approvedBy = approvedBy;
// //     deposit.approvedAt = new Date();
// //     deposit.notes = notes;
// //     await deposit.save();

// //     console.log(`✅ Deposit ${depositId} approved successfully`);

// //     // Get updated deposit with populated fields
// //     const updatedDeposit = await Deposit.findById(depositId)
// //       .populate('userId', 'username name email walletBalance tuftWalletBalance buy') // buy field bhi include kiya
// //       .populate('productId', 'title image status priceRange income handlingFee');

// //     // ✅ SUCCESS RESPONSE
// //     res.status(200).json({
// //       success: true,
// //       message: 'Deposit approved successfully',
// //       data: {
// //         deposit: updatedDeposit,
// //         userWalletUpdate: {
// //           previousWalletBalance: previousWalletBalance,
// //           amountAdded: deposit.amount,
// //           newWalletBalance: currentUser.walletBalance,
// //           buyCount: currentUser.buy // buy count bhi response me include kiya
// //         },
// //         referralBonus: referralBonusInfo // null if no referral
// //       }
// //     });

// //   } catch (error) {
// //     console.error('❌ Error approving deposit:', error);
// //     res.status(500).json({
// //       success: false,
// //       message: 'Error approving deposit',
// //       error: error.message
// //     });
// //   }
// // };

// // // =============================================
// // // REJECT DEPOSIT - NO WALLET UPDATE
// // // =============================================
// // export const rejectDeposit = async (req, res) => {
// //   try {
// //     const { depositId } = req.params;
// //     const { rejectedBy, reason } = req.body;

// //     console.log(`❌ Processing deposit rejection for ID: ${depositId}`);

// //     const deposit = await Deposit.findById(depositId);
// //     if (!deposit) {
// //       return res.status(404).json({
// //         success: false,
// //         message: 'Deposit not found'
// //       });
// //     }

// //     if (deposit.status !== 'pending') {
// //       return res.status(400).json({
// //         success: false,
// //         message: `Deposit is already ${deposit.status}. Cannot reject.`
// //       });
// //     }

// //     // 🔥 INCREMENT USER'S REJECTED COUNT
// //     await User.findByIdAndUpdate(
// //       deposit.userId,
// //       { $inc: { rejected: 1 } }, // rejected count ko +1 kar do
// //       { new: true, upsert: false }
// //     );
// //     console.log('📊 User rejected count incremented');

// //     // ✅ Update deposit status to rejected (NO wallet update)
// //     deposit.status = 'rejected';
// //     deposit.rejectedBy = rejectedBy;
// //     deposit.rejectedAt = new Date();
// //     deposit.rejectionReason = reason;
// //     await deposit.save();

// //     console.log(`❌ Deposit ${depositId} rejected. Amount ${deposit.amount} NOT added to wallet.`);

// //     const updatedDeposit = await Deposit.findById(depositId)
// //       .populate('userId', 'username name email tuftWalletBalance rejected') // rejected field bhi include kiya
// //       .populate('productId', 'title image status priceRange income handlingFee');

// //     res.status(200).json({
// //       success: true,
// //       message: 'Deposit rejected. Amount not added to wallet.',
// //       data: updatedDeposit,
// //       note: 'User wallet balance remains unchanged but rejected count incremented'
// //     });

// //   } catch (error) {
// //     console.error('❌ Error rejecting deposit:', error);
// //     res.status(500).json({
// //       success: false,
// //       message: 'Error rejecting deposit',
// //       error: error.message
// //     });
// //   }
// // };

// // // =============================================
// // // GET ALL DEPOSITS (with filters & pagination)
// // // =============================================
// // export const getDeposits = async (req, res) => {
// //   try {
// //     const {
// //       status,
// //       userId,
// //       productId,
// //       page = 1,
// //       limit = 10,
// //       sortBy = 'createdAt',
// //       order = 'desc'
// //     } = req.query;

// //     // Build filter object
// //     const filter = {};
// //     if (status) filter.status = status;
// //     if (userId) filter.userId = userId;
// //     if (productId) filter.productId = productId;

// //     // Calculate pagination
// //     const skip = (page - 1) * limit;
// //     const sortOrder = order === 'asc' ? 1 : -1;

// //     // Get deposits with populated references
// //     const deposits = await Deposit.find(filter)
// //       .populate('userId', 'username name email tuftWalletBalance')
// //       .populate('productId', 'title image status priceRange income handlingFee')
// //       .sort({ [sortBy]: sortOrder })
// //       .skip(skip)
// //       .limit(parseInt(limit));

// //     // Get total count for pagination
// //     const totalDeposits = await Deposit.countDocuments(filter);
// //     const totalPages = Math.ceil(totalDeposits / limit);

// //     res.status(200).json({
// //       success: true,
// //       data: {
// //         deposits,
// //         pagination: {
// //           currentPage: parseInt(page),
// //           totalPages,
// //           totalDeposits,
// //           hasNextPage: page < totalPages,
// //           hasPrevPage: page > 1
// //         }
// //       }
// //     });

// //   } catch (error) {
// //     console.error('❌ Error fetching deposits:', error);
// //     res.status(500).json({
// //       success: false,
// //       message: 'Error fetching deposits',
// //       error: error.message
// //     });
// //   }
// // };

// // // =============================================
// // // GET SINGLE DEPOSIT BY ID
// // // =============================================
// // export const getDepositById = async (req, res) => {
// //   try {
// //     const { depositId } = req.params;

// //     const deposit = await Deposit.findById(depositId)
// //       .populate('userId', 'username name email phone tuftWalletBalance')
// //       .populate('productId', 'title image status priceRange income handlingFee');

// //     if (!deposit) {
// //       return res.status(404).json({
// //         success: false,
// //         message: 'Deposit not found'
// //       });
// //     }

// //     res.status(200).json({
// //       success: true,
// //       data: deposit
// //     });

// //   } catch (error) {
// //     console.error('❌ Error fetching deposit:', error);
// //     res.status(500).json({
// //       success: false,
// //       message: 'Error fetching deposit',
// //       error: error.message
// //     });
// //   }
// // };

// // // =============================================
// // // UPDATE DEPOSIT DETAILS (Only for pending deposits)
// // // =============================================
// // export const updateDepositDetails = async (req, res) => {
// //   try {
// //     const { depositId } = req.params;
// //     const { amount, referredByCode } = req.body;

// //     const deposit = await Deposit.findById(depositId);
// //     if (!deposit) {
// //       return res.status(404).json({
// //         success: false,
// //         message: 'Deposit not found'
// //       });
// //     }

// //     // Only allow updates if deposit is pending
// //     if (deposit.status !== 'pending') {
// //       return res.status(400).json({
// //         success: false,
// //         message: 'Cannot update deposit details. Deposit is already processed.'
// //       });
// //     }

// //     // Handle new image upload if provided
// //     if (req.file) {
// //       console.log('📤 Uploading new image to Cloudinary...');
// //       const uploadResult = await uploadToCloudinary(req.file, 'deposits');
// //       deposit.attachment = uploadResult.url;
// //     }

// //     // Update allowed fields
// //     if (amount !== undefined) deposit.amount = amount;
// //     if (referredByCode !== undefined) deposit.referredByCode = referredByCode;

// //     await deposit.save();

// //     const updatedDeposit = await Deposit.findById(depositId)
// //       .populate('userId', 'username name email tuftWalletBalance')
// //       .populate('productId', 'title image status priceRange income handlingFee');

// //     res.status(200).json({
// //       success: true,
// //       message: 'Deposit details updated successfully',
// //       data: updatedDeposit
// //     });

// //   } catch (error) {
// //     console.error('❌ Error updating deposit details:', error);
// //     res.status(500).json({
// //       success: false,
// //       message: 'Error updating deposit details',
// //       error: error.message
// //     });
// //   }
// // };

// // // =============================================
// // // GET USER'S DEPOSITS (for user dashboard)
// // // =============================================
// // export const getUserDeposits = async (req, res) => {
// //   try {
// //     const { userId } = req.params;
// //     const { status, page = 1, limit = 10 } = req.query;

// //     // Build filter
// //     const filter = { userId };
// //     if (status) filter.status = status;

// //     // Pagination
// //     const skip = (page - 1) * limit;

// //     const deposits = await Deposit.find(filter)
// //       .populate('productId', 'title image status priceRange income handlingFee')
// //       .sort({ createdAt: -1 })
// //       .skip(skip)
// //       .limit(parseInt(limit));

// //     const totalDeposits = await Deposit.countDocuments(filter);
// //     const totalPages = Math.ceil(totalDeposits / limit);

// //     res.status(200).json({
// //       success: true,
// //       data: {
// //         deposits,
// //         pagination: {
// //           currentPage: parseInt(page),
// //           totalPages,
// //           totalDeposits,
// //           hasNextPage: page < totalPages,
// //           hasPrevPage: page > 1
// //         }
// //       }
// //     });

// //   } catch (error) {
// //     console.error('❌ Error fetching user deposits:', error);
// //     res.status(500).json({
// //       success: false,
// //       message: 'Error fetching user deposits',
// //       error: error.message
// //     });
// //   }
// // };

// // // =============================================
// // // GET DEPOSIT STATISTICS (for admin dashboard)
// // // =============================================
// // export const getDepositStats = async (req, res) => {
// //   try {
// //     const stats = await Deposit.aggregate([
// //       {
// //         $group: {
// //           _id: '$status',
// //           count: { $sum: 1 },
// //           totalAmount: { $sum: '$amount' }
// //         }
// //       }
// //     ]);

// //     // Format the stats
// //     const formattedStats = {
// //       pending: { count: 0, totalAmount: 0 },
// //       approved: { count: 0, totalAmount: 0 },
// //       rejected: { count: 0, totalAmount: 0 }
// //     };

// //     stats.forEach(stat => {
// //       if (formattedStats[stat._id]) {
// //         formattedStats[stat._id] = {
// //           count: stat.count,
// //           totalAmount: stat.totalAmount || 0
// //         };
// //       }
// //     });

// //     // Calculate totals
// //     const totalDeposits = stats.reduce((sum, stat) => sum + stat.count, 0);
// //     const totalAmount = stats.reduce((sum, stat) => sum + (stat.totalAmount || 0), 0);

// //     res.status(200).json({
// //       success: true,
// //       data: {
// //         byStatus: formattedStats,
// //         totals: {
// //           totalDeposits,
// //           totalAmount
// //         }
// //       }
// //     });

// //   } catch (error) {
// //     console.error('❌ Error fetching deposit stats:', error);
// //     res.status(500).json({
// //       success: false,
// //       message: 'Error fetching deposit statistics',
// //       error: error.message
// //     });
// //   }
// // };
// import Deposit from "../models/deposit.model.js";
// import { productModel as Product } from "../models/Product.js";
// import { referralModel } from "../models/Referral.modal.js";
// import User from "../models/User.js";
// import {
//   uploadToCloudinary,
//   deleteFromCloudinary,
// } from "../services/cloudinaryService.js";

// // =============================================
// // CREATE NEW DEPOSIT (with file upload)
// // =============================================
// export const createDeposit = async (req, res) => {
//   try {
//     const {
//       userId,
//       networkType, // TRC20 or BEP20
//       amount,
//       referredByCode,
//       depositAddress,
//       networkFee,
//       networkDescription,
//     } = req.body;

//     console.log("📝 Creating new deposit:", {
//       userId,
//       networkType,
//       amount,
//       depositAddress,
//       networkFee,
//       networkDescription,
//     });

//     // Check if file is uploaded
//     if (!req.file) {
//       return res.status(400).json({
//         success: false,
//         message: "Deposit verification image is required",
//       });
//     }

//     // Validate required fields
//     if (!userId || !networkType) {
//       return res.status(400).json({
//         success: false,
//         message: "Missing required fields: userId and networkType are required",
//       });
//     }

//     // Validate network type
//     if (!["TRC20", "BEP20"].includes(networkType)) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid network type. Must be TRC20 or BEP20",
//       });
//     }

//     // Validate amount
//     if (!amount || amount <= 0) {
//       return res.status(400).json({
//         success: false,
//         message: "Valid amount is required",
//       });
//     }

//     // Verify user exists
//     const user = await User.findById(userId);
//     if (!user) {
//       return res.status(404).json({
//         success: false,
//         message: "User not found",
//       });
//     }

//     // Define network-specific configurations
//     const networkConfigs = {
//       TRC20: {
//         minDeposit: 50,
//         maxDeposit: 100000,
//         networkFee: 1,
//         confirmations: 1,
//         processingTime: "2-30 minutes",
//       },
//       BEP20: {
//         minDeposit: 5,
//         maxDeposit: 100000,
//         networkFee: 0.5,
//         confirmations: 15,
//         processingTime: "2-30 minutes",
//       },
//     };

//     const networkConfig = networkConfigs[networkType];

//     // Validate amount against network limits
//     if (amount < networkConfig.minDeposit) {
//       return res.status(400).json({
//         success: false,
//         message: `Minimum deposit for ${networkType} is ${networkConfig.minDeposit} USDT`,
//       });
//     }

//     if (amount > networkConfig.maxDeposit) {
//       return res.status(400).json({
//         success: false,
//         message: `Maximum deposit for ${networkType} is ${networkConfig.maxDeposit} USDT`,
//       });
//     }

//     // 🔥 Check if user has an active deposit for this network
//     const existingActiveDeposit = await Deposit.findOne({
//       userId,
//       networkType,
//       status: "approved",
//       isIncomeActive: true,
//     });

//     if (existingActiveDeposit) {
//       const remainingDays = existingActiveDeposit.getRemainingDays();
//       return res.status(400).json({
//         success: false,
//         message: `You already have an active ${networkType} deposit. ${remainingDays} days remaining.`,
//         data: {
//           existingDeposit: existingActiveDeposit,
//           remainingDays: remainingDays,
//         },
//       });
//     }

//     // Upload image to Cloudinary
//     console.log("📤 Uploading image to Cloudinary...");
//     const uploadResult = await uploadToCloudinary(req.file, "deposits");

//     // Parse networkFee safely - use default from config if parsing fails
//     let parsedNetworkFee = networkConfig.networkFee; // Default value
//     if (networkFee !== undefined && networkFee !== null && networkFee !== "") {
//       const tempFee = parseFloat(networkFee);
//       if (!isNaN(tempFee)) {
//         parsedNetworkFee = tempFee;
//       }
//     }

//     console.log("💰 Network fee to be saved:", parsedNetworkFee);

//     // Create new deposit - Amount wallet me add NAHI hogi until approved
//     const newDeposit = new Deposit({
//       userId,
//       networkType, // Store network type instead of productId
//       attachment: uploadResult.url,
//       amount: parseFloat(amount),
//       referredByCode,
//       status: "pending", // ✅ Pending state - wallet me amount add nahi hui

//       // Network specific metadata
//       depositAddress: depositAddress || null,
//       networkFee: parsedNetworkFee, // Use parsed value
//       networkDescription: networkDescription || `${networkType} Network`,

//       // Income calculation fields (to be set when approved)
//       dailyIncomeRate: 0, // Will be calculated based on investment plans
//       estimatedDuration: 0, // Will be set based on investment plans
//     });

//     await newDeposit.save();
//     console.log(
//       "✅ Deposit created with pending status - NO wallet update yet"
//     );

//     // 🔥 INCREMENT USER'S DEPOSIT COUNT
//     await User.findByIdAndUpdate(
//       userId,
//       { $inc: { order: 1 } }, // depositCount ko 1 se increase kar do
//       { new: true }
//     );
//     console.log("📊 User deposit count incremented");

//     // Get the created deposit with populated fields
//     const createdDeposit = await Deposit.findById(newDeposit._id).populate(
//       "userId",
//       "username name email phone tuftWalletBalance depositCount"
//     );

//     res.status(201).json({
//       success: true,
//       message: "Deposit created successfully and is pending approval",
//       data: {
//         ...createdDeposit.toObject(),
//         networkType: networkType,
//         networkConfig: networkConfig,
//       },
//       note: "Amount will be added to wallet after admin approval",
//     });
//   } catch (error) {
//     console.error("❌ Error creating deposit:", error);

//     if (error.code === 11000) {
//       return res.status(400).json({
//         success: false,
//         message: "Duplicate deposit detected",
//       });
//     }

//     res.status(500).json({
//       success: false,
//       message: "Error creating deposit",
//       error: error.message,
//     });
//   }
// };

// // =============================================
// // APPROVE DEPOSIT - MAIN WALLET UPDATE LOGIC WITH INCOME DURATION
// // =============================================
// export const approveDeposit = async (req, res) => {
//   try {
//     const { depositId } = req.params;
//     const { approvedBy, notes } = req.body;

//     console.log(`🔍 Processing deposit approval for ID: ${depositId}`);

//     // Find the deposit
//     const deposit = await Deposit.findById(depositId).populate("productId");
//     if (!deposit) {
//       return res.status(404).json({
//         success: false,
//         message: "Deposit not found",
//       });
//     }

//     // Check if deposit is already processed
//     if (deposit.status !== "pending") {
//       return res.status(400).json({
//         success: false,
//         message: `Deposit is already ${deposit.status}. Cannot approve.`,
//       });
//     }

//     // Find the user who made the deposit
//     const currentUser = await User.findById(deposit.userId);
//     if (!currentUser) {
//       return res.status(404).json({
//         success: false,
//         message: "User not found",
//       });
//     }

//     // Get product details
//     const product = deposit.productId;

//     // ✅ STEP 1: Add deposit amount to user's WALLET BALANCE
//     console.log(
//       `💰 Adding deposit amount ${deposit.amount} to user ${currentUser.username}'s walletBalance`
//     );

//     const previousWalletBalance = currentUser.walletBalance || 0;
//     currentUser.walletBalance = previousWalletBalance + deposit.amount;

//     // 🔥 INCREMENT USER'S BUY COUNT
//     currentUser.buy = (currentUser.buy || 0) + 1;

//     await currentUser.save();

//     console.log(
//       `✅ User wallet updated: walletBalance ${previousWalletBalance} → ${currentUser.walletBalance}`
//     );
//     console.log(`📊 User buy count incremented to: ${currentUser.buy}`);

//     // ✅ STEP 2: Set up income duration tracking
//     const currentDate = new Date();
//     const incomeEndDate = new Date(currentDate);
//     incomeEndDate.setDate(currentDate.getDate() + product.duration); // 🔥 Add product duration

//     // Calculate daily income amount
//     const dailyIncomePercentage = product.income / 100; // Convert percentage to decimal
//     const dailyIncomeAmount =
//       (deposit.amount * dailyIncomePercentage) / product.duration;

//     console.log(`📅 Income period: ${product.duration} days`);
//     console.log(
//       `💰 Daily income: ${dailyIncomeAmount} (${product.income}% of ${deposit.amount})`
//     );
//     console.log(`📅 Income start: ${currentDate}`);
//     console.log(`📅 Income end: ${incomeEndDate}`);

//     // ✅ STEP 3: Handle referral bonus (REFERRER ko bonus milega, current user ko nahi)
//     let referralBonusInfo = null;

//     try {
//       // Check if current user was referred by someone
//       if (currentUser.referredByCode) {
//         console.log(
//           `🔍 Current user ${currentUser.username} was referred with code: ${currentUser.referredByCode}`
//         );

//         // Find the REFERRER by their referral code (using myReferralCode field)
//         const referrer = await User.findOne({
//           myReferralCode: currentUser.referredByCode,
//         });

//         if (referrer) {
//           console.log(
//             `👤 Found REFERRER: ${referrer.username} (who referred ${currentUser.username})`
//           );

//           // Get latest referral settings from database
//           const referralSettings = await referralModel
//             .findOne()
//             .sort({ createdAt: -1 });

//           if (referralSettings && referralSettings.percentage > 0) {
//             // Calculate bonus based on percentage from database
//             const bonusPercentage = referralSettings.percentage / 100;
//             const bonusAmount = deposit.amount * bonusPercentage;

//             // ✅ IMPORTANT: Update REFERRER's TUFT wallet balance (referral bonus goes here)
//             const referrerPreviousTuftBalance = referrer.tuftWalletBalance || 0;
//             referrer.tuftWalletBalance =
//               referrerPreviousTuftBalance + bonusAmount;

//             // Update referrer's referral count and add to referred users array
//             if (!referrer.referredUsers.includes(currentUser._id)) {
//               referrer.referredUsers.push(currentUser._id);
//               referrer.referralCount = (referrer.referralCount || 0) + 1;
//             }

//             await referrer.save();

//             referralBonusInfo = {
//               referrerName: referrer.username,
//               referrerCode: referrer.myReferralCode,
//               bonusPercentage: referralSettings.percentage,
//               bonusAmount: bonusAmount,
//               referrerPreviousTuftBalance: referrerPreviousTuftBalance,
//               referrerNewTuftBalance: referrer.tuftWalletBalance,
//             };
//           } else {
//             console.log(
//               "⚠️  No active referral settings found or percentage is 0"
//             );
//           }
//         } else {
//           console.log(
//             `❌ Referrer with code ${currentUser.referredByCode} not found`
//           );
//         }
//       } else {
//         console.log(
//           `ℹ️  User ${currentUser.username} was not referred by anyone - no referral bonus to process`
//         );
//       }
//     } catch (referralError) {
//       console.error("❌ Error processing referral bonus:", referralError);
//       // Don't fail the entire deposit approval if referral bonus fails
//     }

//     // ✅ STEP 4: Update deposit with income tracking info
//     deposit.status = "approved";
//     deposit.approvedBy = approvedBy;
//     deposit.approvedAt = new Date();
//     deposit.notes = notes;
//     deposit.incomeStartDate = currentDate;
//     deposit.incomeEndDate = incomeEndDate;
//     deposit.isIncomeActive = true;
//     deposit.dailyIncomeAmount = dailyIncomeAmount;
//     deposit.lastIncomeDate = null; // Will be set by daily income cron job
//     await deposit.save();

//     console.log(
//       `✅ Deposit ${depositId} approved successfully with income tracking`
//     );

//     // Get updated deposit with populated fields
//     const updatedDeposit = await Deposit.findById(depositId)
//       .populate(
//         "userId",
//         "username name email walletBalance tuftWalletBalance buy"
//       )
//       .populate(
//         "productId",
//         "title image status priceRange income handlingFee duration"
//       ); // 🔥 Include duration

//     // ✅ SUCCESS RESPONSE
//     res.status(200).json({
//       success: true,
//       message: "Deposit approved successfully with income tracking",
//       data: {
//         deposit: updatedDeposit,
//         userWalletUpdate: {
//           previousWalletBalance: previousWalletBalance,
//           amountAdded: deposit.amount,
//           newWalletBalance: currentUser.walletBalance,
//           buyCount: currentUser.buy,
//         },
//         incomeInfo: {
//           duration: product.duration,
//           dailyIncomeAmount: dailyIncomeAmount,
//           totalIncomeExpected: dailyIncomeAmount * product.duration,
//           incomeStartDate: currentDate,
//           incomeEndDate: incomeEndDate,
//           remainingDays: product.duration,
//         },
//         referralBonus: referralBonusInfo, // null if no referral
//       },
//     });
//   } catch (error) {
//     console.error("❌ Error approving deposit:", error);
//     res.status(500).json({
//       success: false,
//       message: "Error approving deposit",
//       error: error.message,
//     });
//   }
// };

// // =============================================
// // NEW: DAILY INCOME CRON JOB FUNCTION
// // =============================================
// export const processDailyIncome = async () => {
//   try {
//     console.log("🚀 Starting daily income processing...");

//     // Find all active deposits that haven't expired
//     const activeDeposits = await Deposit.find({
//       status: "approved",
//       isIncomeActive: true,
//       incomeEndDate: { $gt: new Date() }, // Not expired yet
//     }).populate("userId productId");

//     console.log(
//       `📊 Found ${activeDeposits.length} active deposits for income processing`
//     );

//     for (const deposit of activeDeposits) {
//       try {
//         const today = new Date();
//         const todayDateOnly = new Date(
//           today.getFullYear(),
//           today.getMonth(),
//           today.getDate()
//         );

//         // Check if income was already credited today
//         let lastIncomeDate = null;
//         if (deposit.lastIncomeDate) {
//           lastIncomeDate = new Date(
//             deposit.lastIncomeDate.getFullYear(),
//             deposit.lastIncomeDate.getMonth(),
//             deposit.lastIncomeDate.getDate()
//           );
//         }

//         // Skip if income already credited today
//         if (
//           lastIncomeDate &&
//           lastIncomeDate.getTime() === todayDateOnly.getTime()
//         ) {
//           console.log(
//             `⏭️  Income already credited today for deposit ${deposit._id}`
//           );
//           continue;
//         }

//         // Credit daily income to user's tuftWalletBalance
//         const user = await User.findById(deposit.userId);
//         if (user) {
//           const previousTuftBalance = user.tuftWalletBalance || 0;
//           user.tuftWalletBalance =
//             previousTuftBalance + deposit.dailyIncomeAmount;
//           await user.save();

//           // Update deposit tracking
//           deposit.totalIncomeEarned =
//             (deposit.totalIncomeEarned || 0) + deposit.dailyIncomeAmount;
//           deposit.lastIncomeDate = today;
//           await deposit.save();

//           console.log(
//             `💰 Credited ${deposit.dailyIncomeAmount} to ${user.username} (Deposit: ${deposit._id})`
//           );
//           console.log(
//             `📊 User tuftWalletBalance: ${previousTuftBalance} → ${user.tuftWalletBalance}`
//           );
//         }
//       } catch (error) {
//         console.error(
//           `❌ Error processing income for deposit ${deposit._id}:`,
//           error
//         );
//       }
//     }

//     // Check for expired deposits and mark them as inactive
//     const expiredDeposits = await Deposit.find({
//       status: "approved",
//       isIncomeActive: true,
//       incomeEndDate: { $lte: new Date() }, // Expired
//     });

//     for (const expiredDeposit of expiredDeposits) {
//       expiredDeposit.isIncomeActive = false;
//       await expiredDeposit.save();
//       console.log(
//         `⏰ Marked deposit ${expiredDeposit._id} as expired - income stopped`
//       );
//     }

//     console.log("✅ Daily income processing completed");
//   } catch (error) {
//     console.error("❌ Error in daily income processing:", error);
//   }
// };

// // =============================================
// // NEW: GET USER'S ACTIVE DEPOSITS WITH REMAINING TIME
// // =============================================
// export const getUserActiveDeposits = async (req, res) => {
//   try {
//     const { userId } = req.params;

//     const activeDeposits = await Deposit.find({
//       userId,
//       status: "approved",
//       isIncomeActive: true,
//     }).populate("productId", "title image duration income");

//     // Add remaining days calculation to each deposit
//     const depositsWithRemainingTime = activeDeposits.map((deposit) => {
//       const remainingDays = deposit.getRemainingDays();
//       return {
//         ...deposit.toObject(),
//         remainingDays,
//         isExpired: remainingDays <= 0,
//       };
//     });

//     res.status(200).json({
//       success: true,
//       data: depositsWithRemainingTime,
//       count: depositsWithRemainingTime.length,
//     });
//   } catch (error) {
//     console.error("❌ Error fetching user active deposits:", error);
//     res.status(500).json({
//       success: false,
//       message: "Error fetching active deposits",
//       error: error.message,
//     });
//   }
// };

// // =============================================
// // REJECT DEPOSIT - NO WALLET UPDATE
// // =============================================
// export const rejectDeposit = async (req, res) => {
//   try {
//     const { depositId } = req.params;
//     const { rejectedBy, reason } = req.body;

//     console.log(`❌ Processing deposit rejection for ID: ${depositId}`);

//     const deposit = await Deposit.findById(depositId);
//     if (!deposit) {
//       return res.status(404).json({
//         success: false,
//         message: "Deposit not found",
//       });
//     }

//     if (deposit.status !== "pending") {
//       return res.status(400).json({
//         success: false,
//         message: `Deposit is already ${deposit.status}. Cannot reject.`,
//       });
//     }

//     // 🔥 INCREMENT USER'S REJECTED COUNT
//     await User.findByIdAndUpdate(
//       deposit.userId,
//       { $inc: { rejected: 1 } },
//       { new: true, upsert: false }
//     );
//     console.log("📊 User rejected count incremented");

//     // ✅ Update deposit status to rejected (NO wallet update)
//     deposit.status = "rejected";
//     deposit.rejectedBy = rejectedBy;
//     deposit.rejectedAt = new Date();
//     deposit.rejectionReason = reason;
//     await deposit.save();

//     console.log(
//       `❌ Deposit ${depositId} rejected. Amount ${deposit.amount} NOT added to wallet.`
//     );

//     const updatedDeposit = await Deposit.findById(depositId)
//       .populate("userId", "username name email tuftWalletBalance rejected")
//       .populate(
//         "productId",
//         "title image status priceRange income handlingFee duration"
//       );

//     res.status(200).json({
//       success: true,
//       message: "Deposit rejected. Amount not added to wallet.",
//       data: updatedDeposit,
//       note: "User wallet balance remains unchanged but rejected count incremented",
//     });
//   } catch (error) {
//     console.error("❌ Error rejecting deposit:", error);
//     res.status(500).json({
//       success: false,
//       message: "Error rejecting deposit",
//       error: error.message,
//     });
//   }
// };

// // =============================================
// // GET ALL DEPOSITS (with filters & pagination)
// // =============================================
// export const getDeposits = async (req, res) => {
//   try {
//     const {
//       status,
//       userId,
//       page = 1,
//       limit = 10,
//       sortBy = "createdAt",
//       order = "desc",
//     } = req.query;

//     // Build filter object
//     const filter = {};
//     if (status) filter.status = status;
//     if (userId) filter.userId = userId;

//     // Calculate pagination
//     const skip = (page - 1) * limit;
//     const sortOrder = order === "asc" ? 1 : -1;

//     // Get deposits with populated references
//     const deposits = await Deposit.find(filter)
//       .populate("userId", "username name email tuftWalletBalance")
//       .sort({ [sortBy]: sortOrder })
//       .skip(skip)
//       .limit(parseInt(limit));

//     // Get total count for pagination
//     const totalDeposits = await Deposit.countDocuments(filter);
//     const totalPages = Math.ceil(totalDeposits / limit);

//     res.status(200).json({
//       success: true,
//       data: {
//         deposits,
//         pagination: {
//           currentPage: parseInt(page),
//           totalPages,
//           totalDeposits,
//           hasNextPage: page < totalPages,
//           hasPrevPage: page > 1,
//         },
//       },
//     });
//   } catch (error) {
//     console.error("❌ Error fetching deposits:", error);
//     res.status(500).json({
//       success: false,
//       message: "Error fetching deposits",
//       error: error.message,
//     });
//   }
// };

// // =============================================
// // GET SINGLE DEPOSIT BY ID
// // =============================================
// export const getDepositById = async (req, res) => {
//   try {
//     const { depositId } = req.params;

//     const deposit = await Deposit.findById(depositId)
//       .populate("userId", "username name email phone tuftWalletBalance")
//       .populate(
//         "productId",
//         "title image status priceRange income handlingFee duration"
//       );

//     if (!deposit) {
//       return res.status(404).json({
//         success: false,
//         message: "Deposit not found",
//       });
//     }

//     res.status(200).json({
//       success: true,
//       data: deposit,
//     });
//   } catch (error) {
//     console.error("❌ Error fetching deposit:", error);
//     res.status(500).json({
//       success: false,
//       message: "Error fetching deposit",
//       error: error.message,
//     });
//   }
// };

// // =============================================
// // UPDATE DEPOSIT DETAILS (Only for pending deposits)
// // =============================================
// export const updateDepositDetails = async (req, res) => {
//   try {
//     const { depositId } = req.params;
//     const { amount, referredByCode } = req.body;

//     const deposit = await Deposit.findById(depositId);
//     if (!deposit) {
//       return res.status(404).json({
//         success: false,
//         message: "Deposit not found",
//       });
//     }

//     // Only allow updates if deposit is pending
//     if (deposit.status !== "pending") {
//       return res.status(400).json({
//         success: false,
//         message: "Cannot update deposit details. Deposit is already processed.",
//       });
//     }

//     // Handle new image upload if provided
//     if (req.file) {
//       console.log("📤 Uploading new image to Cloudinary...");
//       const uploadResult = await uploadToCloudinary(req.file, "deposits");
//       deposit.attachment = uploadResult.url;
//     }

//     // Update allowed fields
//     if (amount !== undefined) deposit.amount = amount;
//     if (referredByCode !== undefined) deposit.referredByCode = referredByCode;

//     await deposit.save();

//     const updatedDeposit = await Deposit.findById(depositId)
//       .populate("userId", "username name email tuftWalletBalance")
//       .populate(
//         "productId",
//         "title image status priceRange income handlingFee duration"
//       );

//     res.status(200).json({
//       success: true,
//       message: "Deposit details updated successfully",
//       data: updatedDeposit,
//     });
//   } catch (error) {
//     console.error("❌ Error updating deposit details:", error);
//     res.status(500).json({
//       success: false,
//       message: "Error updating deposit details",
//       error: error.message,
//     });
//   }
// };

// // =============================================
// // GET USER'S DEPOSITS (for user dashboard)
// // =============================================
// export const getUserDeposits = async (req, res) => {
//   try {
//     const { userId } = req.params;
//     const { status, page = 1, limit = 10 } = req.query;

//     // Build filter
//     const filter = { userId };
//     if (status) filter.status = status;

//     // Pagination
//     const skip = (page - 1) * limit;

//     const deposits = await Deposit.find(filter)
//       .populate(
//         "productId",
//         "title image status priceRange income handlingFee duration"
//       )
//       .sort({ createdAt: -1 })
//       .skip(skip)
//       .limit(parseInt(limit));

//     const totalDeposits = await Deposit.countDocuments(filter);
//     const totalPages = Math.ceil(totalDeposits / limit);

//     res.status(200).json({
//       success: true,
//       data: {
//         deposits,
//         pagination: {
//           currentPage: parseInt(page),
//           totalPages,
//           totalDeposits,
//           hasNextPage: page < totalPages,
//           hasPrevPage: page > 1,
//         },
//       },
//     });
//   } catch (error) {
//     console.error("❌ Error fetching user deposits:", error);
//     res.status(500).json({
//       success: false,
//       message: "Error fetching user deposits",
//       error: error.message,
//     });
//   }
// };

// // =============================================
// // GET DEPOSIT STATISTICS (for admin dashboard)
// // =============================================
// export const getDepositStats = async (req, res) => {
//   try {
//     const stats = await Deposit.aggregate([
//       {
//         $group: {
//           _id: "$status",
//           count: { $sum: 1 },
//           totalAmount: { $sum: "$amount" },
//         },
//       },
//     ]);

//     // Format the stats
//     const formattedStats = {
//       pending: { count: 0, totalAmount: 0 },
//       approved: { count: 0, totalAmount: 0 },
//       rejected: { count: 0, totalAmount: 0 },
//     };

//     stats.forEach((stat) => {
//       if (formattedStats[stat._id]) {
//         formattedStats[stat._id] = {
//           count: stat.count,
//           totalAmount: stat.totalAmount || 0,
//         };
//       }
//     });

//     // Calculate totals
//     const totalDeposits = stats.reduce((sum, stat) => sum + stat.count, 0);
//     const totalAmount = stats.reduce(
//       (sum, stat) => sum + (stat.totalAmount || 0),
//       0
//     );

//     res.status(200).json({
//       success: true,
//       data: {
//         byStatus: formattedStats,
//         totals: {
//           totalDeposits,
//           totalAmount,
//         },
//       },
//     });
//   } catch (error) {
//     console.error("❌ Error fetching deposit stats:", error);
//     res.status(500).json({
//       success: false,
//       message: "Error fetching deposit statistics",
//       error: error.message,
//     });
//   }
// };

import Deposit from "../models/deposit.model.js";
import { referralModel } from "../models/Referral.modal.js";
import User from "../models/User.js";
import { productModel } from "../models/Product.js";
import {
  uploadToCloudinary,
  deleteFromCloudinary,
} from "../services/cloudinaryService.js";

// Network configurations (shared across functions)
const NETWORK_CONFIGS = {
  TRC20: {
    minDeposit: 50,
    maxDeposit: 100000,
    networkFee: 1,
    confirmations: 1,
    processingTime: "2-30 minutes",
    displayName: "TRON Network (TRC-20)",
    defaultDuration: 30, // Default income duration in days
    defaultIncomeRate: 2, // Default daily income rate in percentage
  },
  BEP20: {
    minDeposit: 50,
    maxDeposit: 100000,
    networkFee: 0.5,
    confirmations: 15,
    processingTime: "2-30 minutes",
    displayName: "BNB Smart Chain (BEP-20)",
    defaultDuration: 30, // Default income duration in days
    defaultIncomeRate: 2, // Default daily income rate in percentage
  },
};

// =============================================
// CREATE NEW DEPOSIT (Network-based)
// =============================================
export const createDeposit = async (req, res) => {
  try {
    const {
      userId,
      networkType, // TRC20 or BEP20
      amount,
      referredByCode,
      depositAddress,
      networkFee,
      networkDescription,
    } = req.body;

    console.log("📝 Creating new deposit:", {
      userId,
      networkType,
      amount,
      depositAddress,
      networkFee,
      networkDescription,
    });

    // Check if file is uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Deposit verification image is required",
      });
    }

    // Validate required fields
    if (!userId || !networkType) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: userId and networkType are required",
      });
    }

    // Validate network type
    if (!["TRC20", "BEP20"].includes(networkType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid network type. Must be TRC20 or BEP20",
      });
    }

    // Validate amount
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Valid amount is required",
      });
    }

    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Define network-specific configurations
    const networkConfigs = {
      TRC20: {
        networkFee: 1,
        confirmations: 1,
        processingTime: "2-30 minutes",
      },
      BEP20: {
        networkFee: 0.5,
        confirmations: 15,
        processingTime: "2-30 minutes",
      },
    };

    const networkConfig = networkConfigs[networkType];

    // Upload image to Cloudinary
    console.log("📤 Uploading image to Cloudinary...");
    const uploadResult = await uploadToCloudinary(req.file, "deposits");

    // Parse networkFee safely - use default from config if parsing fails
    let parsedNetworkFee = networkConfig.networkFee; // Default value
    if (networkFee !== undefined && networkFee !== null && networkFee !== "") {
      const tempFee = parseFloat(networkFee);
      if (!isNaN(tempFee)) {
        parsedNetworkFee = tempFee;
      }
    }

    console.log("💰 Network fee to be saved:", parsedNetworkFee);

    // Create new deposit - Amount wallet me add NAHI hogi until approved
    const newDeposit = new Deposit({
      userId,
      networkType, // Store network type instead of productId
      attachment: uploadResult.url,
      amount: parseFloat(amount),
      referredByCode,
      status: "pending", // ✅ Pending state - wallet me amount add nahi hui

      // Network specific metadata
      depositAddress: depositAddress || null,
      networkFee: parsedNetworkFee, // Use parsed value
      networkDescription: networkDescription || `${networkType} Network`,

      // Income calculation fields (to be set when approved)
      dailyIncomeRate: 0, // Will be calculated based on investment plans
      estimatedDuration: 0, // Will be set based on investment plans
    });

    await newDeposit.save();
    console.log(
      "✅ Deposit created with pending status - NO wallet update yet"
    );

    // 🔥 INCREMENT USER'S DEPOSIT COUNT
    await User.findByIdAndUpdate(
      userId,
      { $inc: { order: 1 } }, // depositCount ko 1 se increase kar do
      { new: true }
    );
    console.log("📊 User deposit count incremented");

    // Get the created deposit with populated fields
    const createdDeposit = await Deposit.findById(newDeposit._id).populate(
      "userId",
      "username name email phone tuftWalletBalance depositCount"
    );

    res.status(201).json({
      success: true,
      message: "Deposit created successfully and is pending approval",
      data: {
        ...createdDeposit.toObject(),
        networkType: networkType,
        networkConfig: networkConfig,
      },
      note: "Amount will be added to wallet after admin approval",
    });
  } catch (error) {
    console.error("❌ Error creating deposit:", error);

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Duplicate deposit detected",
      });
    }

    res.status(500).json({
      success: false,
      message: "Error creating deposit",
      error: error.message,
    });
  }
};

// Helper function to get deposit limits for a specific level
export const getDepositLimitsByLevel = (level) => {
  const levelDepositLimits = {
    1: { min: 50, max: 1000 },
    2: { min: 500, max: 2000 },
    3: { min: 2000, max: 5000 },
    4: { min: 5000, max: 10000 },
    5: { min: 10000, max: 20000 },
  };

  return levelDepositLimits[level] || levelDepositLimits[1];
};

// API endpoint to get user's deposit limits
export const getUserDepositLimits = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const userLevel = user.levels || 1;
    const depositLimits = getDepositLimitsByLevel(userLevel);

    // Get all level limits for comparison
    const allLevelLimits = {
      1: { min: 50, max: 1000 },
      2: { min: 500, max: 2000 },
      3: { min: 2000, max: 5000 },
      4: { min: 5000, max: 10000 },
      5: { min: 10000, max: 20000 },
    };

    res.status(200).json({
      success: true,
      data: {
        currentLevel: userLevel,
        currentLimits: depositLimits,
        allLevels: allLevelLimits,
        canUpgrade: userLevel < 5,
        nextLevelBenefit:
          userLevel < 5
            ? {
                level: userLevel + 1,
                limits: allLevelLimits[userLevel + 1],
                increasedMax:
                  allLevelLimits[userLevel + 1].max - depositLimits.max,
              }
            : null,
      },
    });
  } catch (error) {
    console.error("❌ Error fetching deposit limits:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching deposit limits",
      error: error.message,
    });
  }
};

// =============================================
// APPROVE DEPOSIT (Network-based with income tracking)
// =============================================
export const approveDeposit = async (req, res) => {
  try {
    const { depositId } = req.params;
    const { approvedBy, notes } = req.body;

    console.log(`🔍 Processing deposit approval for ID: ${depositId}`);

    // Find the deposit
    const deposit = await Deposit.findById(depositId);
    if (!deposit) {
      return res.status(404).json({
        success: false,
        message: "Deposit not found",
      });
    }

    // Check if deposit is already processed
    if (deposit.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Deposit is already ${deposit.status}. Cannot approve.`,
      });
    }

    // Find the user
    const currentUser = await User.findById(deposit.userId);
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // STEP 1: Add deposit amount to user's WALLET BALANCE
    console.log(
      `💰 Adding deposit amount ${deposit.amount} to user ${currentUser.username}'s walletBalance`
    );

    const previousWalletBalance = currentUser.walletBalance || 0;
    const previousAvailableBalance = currentUser.availableBalance || 0;
    currentUser.walletBalance = previousWalletBalance + deposit.amount;
    currentUser.availableBalance = previousAvailableBalance + deposit.amount;

    // INCREMENT USER'S BUY COUNT
    currentUser.buy = (currentUser.buy || 0) + 1;

    await currentUser.save();

    console.log(
      `✅ User wallet updated: ${previousWalletBalance} → ${currentUser.walletBalance}`
    );
    console.log(`📊 User buy count incremented to: ${currentUser.buy}`);

    // STEP 2: Handle referral bonus
    let referralBonusInfo = null;

    try {
      if (currentUser.referredByCode) {
        console.log(
          `🔍 User was referred with code: ${currentUser.referredByCode}`
        );

        const referrer = await User.findOne({
          myReferralCode: currentUser.referredByCode,
        });

        if (referrer) {
          console.log(`👤 Found referrer: ${referrer.username}`);

          const referralSettings = await referralModel
            .findOne()
            .sort({ createdAt: -1 });

          if (referralSettings && referralSettings.percentage > 0) {
            const bonusPercentage = referralSettings.percentage / 100;
            const bonusAmount = deposit.amount * bonusPercentage;

            const referrerPreviousTuftBalance = referrer.tuftWalletBalance || 0;
            referrer.tuftWalletBalance =
              referrerPreviousTuftBalance + bonusAmount;

            if (!referrer.referredUsers.includes(currentUser._id)) {
              referrer.referredUsers.push(currentUser._id);
              referrer.referralCount = (referrer.referralCount || 0) + 1;
            }

            await referrer.save();

            referralBonusInfo = {
              referrerName: referrer.username,
              referrerCode: referrer.myReferralCode,
              bonusPercentage: referralSettings.percentage,
              bonusAmount: bonusAmount,
              referrerPreviousTuftBalance: referrerPreviousTuftBalance,
              referrerNewTuftBalance: referrer.tuftWalletBalance,
            };
          }
        }
      }
    } catch (referralError) {
      console.error("❌ Error processing referral bonus:", referralError);
    }

    // STEP 3: Update deposit status only
    deposit.status = "approved";
    deposit.approvedBy = approvedBy;
    deposit.approvedAt = new Date();
    deposit.notes = notes;
    await deposit.save();

    console.log(`✅ Deposit ${depositId} approved successfully`);

    // Get updated deposit
    const updatedDeposit = await Deposit.findById(depositId).populate(
      "userId",
      "username name email walletBalance tuftWalletBalance buy"
    );

    res.status(200).json({
      success: true,
      message: "Deposit approved successfully",
      data: {
        deposit: updatedDeposit,
        userWalletUpdate: {
          previousWalletBalance: previousWalletBalance,
          amountAdded: deposit.amount,
          newWalletBalance: currentUser.walletBalance,
          buyCount: currentUser.buy,
        },
        referralBonus: referralBonusInfo,
      },
    });
  } catch (error) {
    console.error("❌ Error approving deposit:", error);
    res.status(500).json({
      success: false,
      message: "Error approving deposit",
      error: error.message,
    });
  }
};

// =============================================
// REJECT DEPOSIT
// =============================================
export const rejectDeposit = async (req, res) => {
  try {
    const { depositId } = req.params;
    const { rejectedBy, reason } = req.body;

    console.log(`❌ Processing deposit rejection for ID: ${depositId}`);

    const deposit = await Deposit.findById(depositId);
    if (!deposit) {
      return res.status(404).json({
        success: false,
        message: "Deposit not found",
      });
    }

    if (deposit.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Deposit is already ${deposit.status}. Cannot reject.`,
      });
    }

    // INCREMENT USER'S REJECTED COUNT
    await User.findByIdAndUpdate(
      deposit.userId,
      { $inc: { rejected: 1 } },
      { new: true }
    );
    console.log("📊 User rejected count incremented");

    // Update deposit status
    deposit.status = "rejected";
    deposit.rejectedBy = rejectedBy;
    deposit.rejectedAt = new Date();
    deposit.rejectionReason = reason;
    await deposit.save();

    const updatedDeposit = await Deposit.findById(depositId).populate(
      "userId",
      "username name email tuftWalletBalance rejected"
    );

    res.status(200).json({
      success: true,
      message: "Deposit rejected. Amount not added to wallet.",
      data: updatedDeposit,
      note: "User wallet balance remains unchanged",
    });
  } catch (error) {
    console.error("❌ Error rejecting deposit:", error);
    res.status(500).json({
      success: false,
      message: "Error rejecting deposit",
      error: error.message,
    });
  }
};

// =============================================
// GET ALL DEPOSITS (Network-based)
// =============================================
export const getDeposits = async (req, res) => {
  try {
    const {
      status,
      userId,
      networkType,
      isIncomeActive,
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      order = "desc",
      startDate,
      endDate,
    } = req.query;

    console.log("📋 Fetching deposits with filters:", {
      status,
      userId,
      networkType,
      page,
      limit,
    });

    // Build filter object
    const filter = {};

    if (status) filter.status = status;
    if (userId) filter.userId = userId;
    if (networkType) {
      if (["TRC20", "BEP20"].includes(networkType)) {
        filter.networkType = networkType;
      } else {
        return res.status(400).json({
          success: false,
          message: "Invalid network type. Must be TRC20 or BEP20",
        });
      }
    }

    if (isIncomeActive !== undefined) {
      filter.isIncomeActive = isIncomeActive === "true";
    }

    // Date range filter
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    // Calculate pagination
    const skip = (page - 1) * limit;
    const sortOrder = order === "asc" ? 1 : -1;

    // Get deposits
    const deposits = await Deposit.find(filter)
      .populate(
        "userId",
        "username name email phone tuftWalletBalance depositCount"
      )
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(parseInt(limit));

    // Transform deposits to include network information
    const transformedDeposits = deposits.map((deposit) => {
      const depositObj = deposit.toObject();
      return {
        ...depositObj,
        networkInfo: NETWORK_CONFIGS[deposit.networkType] || null,
        daysRemaining: deposit.isIncomeActive ? deposit.getRemainingDays() : 0,
        incomeProgress: deposit.isIncomeActive
          ? deposit.getProgressPercentage()
          : 0,
      };
    });

    // Get total count
    const totalDeposits = await Deposit.countDocuments(filter);
    const totalPages = Math.ceil(totalDeposits / limit);

    // Get summary statistics
    const summaryStats = await Deposit.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$amount" },
          totalApproved: {
            $sum: {
              $cond: [{ $eq: ["$status", "approved"] }, "$amount", 0],
            },
          },
          totalPending: {
            $sum: {
              $cond: [{ $eq: ["$status", "pending"] }, "$amount", 0],
            },
          },
          totalRejected: {
            $sum: {
              $cond: [{ $eq: ["$status", "rejected"] }, "$amount", 0],
            },
          },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: {
        deposits: transformedDeposits,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalDeposits,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
          limit: parseInt(limit),
        },
        summary: summaryStats[0] || {
          totalAmount: 0,
          totalApproved: 0,
          totalPending: 0,
          totalRejected: 0,
        },
      },
      message: `Found ${deposits.length} deposits`,
    });
  } catch (error) {
    console.error("❌ Error fetching deposits:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching deposits",
      error: error.message,
    });
  }
};

// =============================================
// GET SINGLE DEPOSIT BY ID
// =============================================
export const getDepositById = async (req, res) => {
  try {
    const { depositId } = req.params;

    const deposit = await Deposit.findById(depositId).populate(
      "userId",
      "username name email phone tuftWalletBalance"
    );

    if (!deposit) {
      return res.status(404).json({
        success: false,
        message: "Deposit not found",
      });
    }

    // Add network info and calculated fields
    const depositData = {
      ...deposit.toObject(),
      networkInfo: NETWORK_CONFIGS[deposit.networkType] || null,
      daysRemaining: deposit.isIncomeActive ? deposit.getRemainingDays() : 0,
      incomeProgress: deposit.isIncomeActive
        ? deposit.getProgressPercentage()
        : 0,
    };

    res.status(200).json({
      success: true,
      data: depositData,
    });
  } catch (error) {
    console.error("❌ Error fetching deposit:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching deposit",
      error: error.message,
    });
  }
};

// =============================================
// UPDATE DEPOSIT DETAILS (Only for pending)
// =============================================
export const updateDepositDetails = async (req, res) => {
  try {
    const { depositId } = req.params;
    const { amount, referredByCode, networkType } = req.body;

    const deposit = await Deposit.findById(depositId);
    if (!deposit) {
      return res.status(404).json({
        success: false,
        message: "Deposit not found",
      });
    }

    // Only allow updates if deposit is pending
    if (deposit.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Cannot update deposit. Deposit is already processed.",
      });
    }

    // Handle new image upload if provided
    if (req.file) {
      console.log("📤 Uploading new image to Cloudinary...");
      const uploadResult = await uploadToCloudinary(req.file, "deposits");
      deposit.attachment = uploadResult.url;
    }

    // Update allowed fields
    if (amount !== undefined) {
      // Validate amount against network limits
      const networkConfig = NETWORK_CONFIGS[deposit.networkType];
      if (
        amount < networkConfig.minDeposit ||
        amount > networkConfig.maxDeposit
      ) {
        return res.status(400).json({
          success: false,
          message: `Amount must be between ${networkConfig.minDeposit} and ${networkConfig.maxDeposit}`,
        });
      }
      deposit.amount = amount;
    }

    if (referredByCode !== undefined) deposit.referredByCode = referredByCode;

    // Allow network type change if needed
    if (networkType && ["TRC20", "BEP20"].includes(networkType)) {
      deposit.networkType = networkType;
      deposit.networkFee = NETWORK_CONFIGS[networkType].networkFee;
      deposit.networkDescription = NETWORK_CONFIGS[networkType].displayName;
    }

    await deposit.save();

    const updatedDeposit = await Deposit.findById(depositId).populate(
      "userId",
      "username name email tuftWalletBalance"
    );

    res.status(200).json({
      success: true,
      message: "Deposit details updated successfully",
      data: updatedDeposit,
    });
  } catch (error) {
    console.error("❌ Error updating deposit details:", error);
    res.status(500).json({
      success: false,
      message: "Error updating deposit details",
      error: error.message,
    });
  }
};

// =============================================
// GET USER'S DEPOSITS
// =============================================
export const getUserDeposits = async (req, res) => {
  try {
    const { userId } = req.params;
    const { status, networkType, isIncomeActive } = req.query;

    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Build filter
    const filter = { userId };
    if (status) filter.status = status;
    if (networkType) filter.networkType = networkType;
    if (isIncomeActive !== undefined) {
      filter.isIncomeActive = isIncomeActive === "true";
    }

    // Get user's deposits
    const deposits = await Deposit.find(filter).sort({ createdAt: -1 });

    // Group deposits by network type
    const depositsByNetwork = {
      TRC20: deposits.filter((d) => d.networkType === "TRC20"),
      BEP20: deposits.filter((d) => d.networkType === "BEP20"),
    };

    // Calculate user statistics
    const userStats = {
      totalDeposits: deposits.length,
      totalAmount: deposits.reduce((sum, d) => sum + (d.amount || 0), 0),
      activeDeposits: deposits.filter((d) => d.isIncomeActive).length,
      pendingDeposits: deposits.filter((d) => d.status === "pending").length,
      approvedDeposits: deposits.filter((d) => d.status === "approved").length,
      rejectedDeposits: deposits.filter((d) => d.status === "rejected").length,
      totalIncomeEarned: deposits.reduce(
        (sum, d) => sum + (d.totalIncomeEarned || 0),
        0
      ),
      depositsByNetwork: {
        TRC20: {
          count: depositsByNetwork.TRC20.length,
          totalAmount: depositsByNetwork.TRC20.reduce(
            (sum, d) => sum + (d.amount || 0),
            0
          ),
          activeCount: depositsByNetwork.TRC20.filter((d) => d.isIncomeActive)
            .length,
        },
        BEP20: {
          count: depositsByNetwork.BEP20.length,
          totalAmount: depositsByNetwork.BEP20.reduce(
            (sum, d) => sum + (d.amount || 0),
            0
          ),
          activeCount: depositsByNetwork.BEP20.filter((d) => d.isIncomeActive)
            .length,
        },
      },
    };

    // Transform deposits with additional info
    const transformedDeposits = deposits.map((deposit) => ({
      ...deposit.toObject(),
      networkInfo: NETWORK_CONFIGS[deposit.networkType] || null,
      daysRemaining: deposit.isIncomeActive ? deposit.getRemainingDays() : 0,
      incomeProgress: deposit.isIncomeActive
        ? deposit.getProgressPercentage()
        : 0,
    }));

    res.status(200).json({
      success: true,
      data: {
        deposits: transformedDeposits,
        userStats,
        user: {
          id: user._id,
          name: user.name || user.username,
          email: user.email,
          walletBalance: user.walletBalance || 0,
          tuftWalletBalance: user.tuftWalletBalance || 0,
          depositCount: user.order || 0,
        },
      },
      message: `Found ${deposits.length} deposits for user`,
    });
  } catch (error) {
    console.error("❌ Error fetching user deposits:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching user deposits",
      error: error.message,
    });
  }
};

// =============================================
// GET USER'S ACTIVE DEPOSITS
// =============================================
export const getUserActiveDeposits = async (req, res) => {
  try {
    const { userId } = req.params;

    const activeDeposits = await Deposit.find({
      userId,
      status: "approved",
      isIncomeActive: true,
    });

    // Add remaining days and network info
    const depositsWithInfo = activeDeposits.map((deposit) => {
      const remainingDays = deposit.getRemainingDays();
      return {
        ...deposit.toObject(),
        networkInfo: NETWORK_CONFIGS[deposit.networkType] || null,
        remainingDays,
        isExpired: remainingDays <= 0,
        incomeProgress: deposit.getProgressPercentage(),
      };
    });

    res.status(200).json({
      success: true,
      data: depositsWithInfo,
      count: depositsWithInfo.length,
    });
  } catch (error) {
    console.error("❌ Error fetching user active deposits:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching active deposits",
      error: error.message,
    });
  }
};

// =============================================
// PROCESS DAILY INCOME (Cron Job Function)
// =============================================
export const processDailyIncome = async () => {
  try {
    console.log("🚀 Starting daily income processing...");

    // Find all active deposits that haven't expired
    const activeDeposits = await Deposit.find({
      status: "approved",
      isIncomeActive: true,
      incomeEndDate: { $gt: new Date() },
    }).populate("userId");

    console.log(
      `📊 Found ${activeDeposits.length} active deposits for income processing`
    );

    for (const deposit of activeDeposits) {
      try {
        const today = new Date();
        const todayDateOnly = new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate()
        );

        // Check if income was already credited today
        let lastIncomeDate = null;
        if (deposit.lastIncomeDate) {
          lastIncomeDate = new Date(
            deposit.lastIncomeDate.getFullYear(),
            deposit.lastIncomeDate.getMonth(),
            deposit.lastIncomeDate.getDate()
          );
        }

        // Skip if income already credited today
        if (
          lastIncomeDate &&
          lastIncomeDate.getTime() === todayDateOnly.getTime()
        ) {
          console.log(
            `⏭️  Income already credited today for deposit ${deposit._id}`
          );
          continue;
        }

        // Credit daily income to user's tuftWalletBalance
        const user = await User.findById(deposit.userId);
        if (user) {
          const previousTuftBalance = user.tuftWalletBalance || 0;
          user.tuftWalletBalance =
            previousTuftBalance + deposit.dailyIncomeAmount;
          await user.save();

          // Update deposit tracking
          deposit.totalIncomeEarned =
            (deposit.totalIncomeEarned || 0) + deposit.dailyIncomeAmount;
          deposit.lastIncomeDate = today;
          await deposit.save();

          console.log(
            `💰 Credited ${deposit.dailyIncomeAmount} to ${user.username} (Deposit: ${deposit._id})`
          );
          console.log(
            `📊 User tuftWalletBalance: ${previousTuftBalance} → ${user.tuftWalletBalance}`
          );
        }
      } catch (error) {
        console.error(
          `❌ Error processing income for deposit ${deposit._id}:`,
          error
        );
      }
    }

    // Mark expired deposits as inactive
    const expiredDeposits = await Deposit.find({
      status: "approved",
      isIncomeActive: true,
      incomeEndDate: { $lte: new Date() },
    });

    for (const expiredDeposit of expiredDeposits) {
      expiredDeposit.isIncomeActive = false;
      await expiredDeposit.save();
      console.log(`⏰ Marked deposit ${expiredDeposit._id} as expired`);
    }

    console.log("✅ Daily income processing completed");
  } catch (error) {
    console.error("❌ Error in daily income processing:", error);
  }
};

// =============================================
// GET DEPOSIT STATISTICS (Admin Dashboard)
// =============================================
export const getDepositStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Build date filter
    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
    }

    // Get overall statistics
    const stats = await Deposit.aggregate([
      { $match: dateFilter },
      {
        $facet: {
          // Overall stats
          overall: [
            {
              $group: {
                _id: null,
                totalDeposits: { $sum: 1 },
                totalAmount: { $sum: "$amount" },
                avgAmount: { $avg: "$amount" },
                totalIncomeEarned: { $sum: "$totalIncomeEarned" },
              },
            },
          ],
          // Status breakdown
          byStatus: [
            {
              $group: {
                _id: "$status",
                count: { $sum: 1 },
                totalAmount: { $sum: "$amount" },
              },
            },
          ],
          // Network breakdown
          byNetwork: [
            {
              $group: {
                _id: "$networkType",
                count: { $sum: 1 },
                totalAmount: { $sum: "$amount" },
                avgAmount: { $avg: "$amount" },
                activeCount: {
                  $sum: { $cond: ["$isIncomeActive", 1, 0] },
                },
              },
            },
          ],
          // Daily trends (last 30 days)
          dailyTrends: [
            {
              $match: {
                createdAt: {
                  $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                },
              },
            },
            {
              $group: {
                _id: {
                  $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
                },
                count: { $sum: 1 },
                totalAmount: { $sum: "$amount" },
              },
            },
            { $sort: { _id: 1 } },
          ],
          // Top depositors
          topDepositors: [
            {
              $group: {
                _id: "$userId",
                totalDeposits: { $sum: 1 },
                totalAmount: { $sum: "$amount" },
              },
            },
            { $sort: { totalAmount: -1 } },
            { $limit: 10 },
            {
              $lookup: {
                from: "users",
                localField: "_id",
                foreignField: "_id",
                as: "userInfo",
              },
            },
            {
              $project: {
                userId: "$_id",
                totalDeposits: 1,
                totalAmount: 1,
                userName: { $arrayElemAt: ["$userInfo.name", 0] },
                userEmail: { $arrayElemAt: ["$userInfo.email", 0] },
              },
            },
          ],
        },
      },
    ]);

    // Format the response
    const formattedStats = {
      overall: stats[0].overall[0] || {
        totalDeposits: 0,
        totalAmount: 0,
        avgAmount: 0,
        totalIncomeEarned: 0,
      },
      byStatus: stats[0].byStatus.reduce((acc, item) => {
        acc[item._id] = {
          count: item.count,
          totalAmount: item.totalAmount,
        };
        return acc;
      }, {}),
      byNetwork: stats[0].byNetwork.reduce((acc, item) => {
        acc[item._id] = {
          count: item.count,
          totalAmount: item.totalAmount,
          avgAmount: item.avgAmount,
          activeCount: item.activeCount,
        };
        return acc;
      }, {}),
      dailyTrends: stats[0].dailyTrends,
      topDepositors: stats[0].topDepositors,
      networkConfigs: NETWORK_CONFIGS, // Include network configs for reference
    };

    res.status(200).json({
      success: true,
      data: formattedStats,
      message: "Deposit statistics retrieved successfully",
    });
  } catch (error) {
    console.error("❌ Error fetching deposit stats:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching deposit statistics",
      error: error.message,
    });
  }
};
