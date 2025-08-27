import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.js";
import adminRoutes from "./routes/admin.js";
import productRoutes from "./routes/product.js";
import depositRoutes from "./routes/deposit.js";
import withdrawalRoutes from "./routes/withdrawal.js";
import referralsRoutes from "./routes/referral.js";
import heroImageRoutes from "./routes/heroImage.js";
import notificationRoutes from "./routes/notification.js";
import stakesRoutes from "./routes/stake.js";
import cron from "node-cron";
import { checkAndUnfreezeUsers } from "./controllers/authController.js";
import { triggerDailyIncomeManually } from "./services/cronJops.js";
import { processMaturedStakes } from "./controllers/stake.controller.js";

// import stakeRoutes from "./routes/stakes.js";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(
  cors({
    origin: [
      "http://localhost:3006",
      "http://127.0.0.1:5500",
      "http://localhost:5173",
      "http://localhost:5174",
      "http://localhost:5175",
      "http://localhost:5176",
      "http://localhost:5177",
      "http://localhost:5178",
      "http://localhost:5179",
      "http://localhost:5180",
      "http://localhost:5181",
      "http://localhost:5182",
      "http://localhost:5183",
      "https://treasure-fun.vercel.app",
      "https://treasure-fun-admin.vercel.app",
      "https://nimofficial.com",
      "https://www.nimofficial.com",
      "https://admin.nimofficial.com",
      "null",
    ],
    credentials: true,
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

cron.schedule("0 * * * *", () => {
  console.log("Checking for matured stakes...");
  processMaturedStakes();
});

// every 10 seconds
// cron.schedule("*/10 * * * * *", () => {
//   console.log("Checking for matured stakes...");
//   processMaturedStakes();
// });

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/treasure_fun",
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }
    );
    console.log("✅ Connected to MongoDB");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }
};

// Initialize database connection
connectDB();

// Handle MongoDB connection events
mongoose.connection.on("disconnected", () => {
  console.log("⚠️  MongoDB disconnected");
});

mongoose.connection.on("error", (error) => {
  console.error("❌ MongoDB error:", error);
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/stake", stakesRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/products", productRoutes);
app.use("/api/deposits", depositRoutes);
app.use("/api/withdrawals", withdrawalRoutes);
app.use("/api/referrals", referralsRoutes);
app.use("/api/hero-image", heroImageRoutes);
app.use("/api/notification", notificationRoutes);
cron.schedule("0 * * * *", async () => {
  console.log("🔄 Running scheduled user unfreeze check...");
  try {
    const unfrozeCount = await checkAndUnfreezeUsers();
    console.log(`✅ Scheduled check completed: ${unfrozeCount} users unfroze`);
  } catch (error) {
    console.error("❌ Error in scheduled unfreeze check:", error);
  }
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Server is running!",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

// API info endpoint
app.get("/api", (req, res) => {
  res.json({
    success: true,
    message: "Treasure Fun API",
    version: "1.0.0",
    endpoints: {
      auth: {
        generateReferralCode: "POST /api/auth/generate-referral-code",
        signup: "POST /api/auth/signup",
        login: "POST /api/auth/login",
        profile: "GET /api/auth/profile",
        updateProfile: "PUT /api/auth/profile",
        logout: "POST /api/auth/logout",
        verifyToken: "GET /api/auth/verify-token",
      },
      // stakes: {
      //   createStake: "POST /api/stakes",
      //   getAllStakes: "GET /api/stakes",
      //   getStakeById: "GET /api/stakes/:id",
      //   updateStake: "PUT /api/stakes/:id",
      //   deleteStake: "DELETE /api/stakes/:id",
      //   myStakes: "GET /api/stakes/my-stakes",
      //   userStakes: "GET /api/stakes/user/:userId",
      //   stakeStats: "GET /api/stakes/stats",
      // },
    },
  });
});

app.post("/api/admin/trigger-daily-income", async (req, res) => {
  try {
    // Add authentication middleware here to ensure only admin can access
    await triggerDailyIncomeManually();
    res.json({
      success: true,
      message: "Daily income processing triggered manually",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to trigger daily income",
      error: error.message,
    });
  }
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error("Global error:", error);

  // Mongoose validation error
  if (error.name === "ValidationError") {
    const errors = Object.values(error.errors).map((err) => ({
      field: err.path,
      message: err.message,
    }));
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors,
    });
  }

  // Mongoose duplicate key error
  if (error.code === 11000) {
    const field = Object.keys(error.keyPattern)[0];
    const fieldName = field === "mobileNo" ? "Mobile number" : field;
    return res.status(409).json({
      success: false,
      message: `${fieldName} already exists`,
    });
  }

  // JWT errors
  if (error.name === "JsonWebTokenError") {
    return res.status(401).json({
      success: false,
      message: "Invalid token",
    });
  }

  if (error.name === "TokenExpiredError") {
    return res.status(401).json({
      success: false,
      message: "Token expired",
    });
  }

  // Default error
  res.status(error.status || 500).json({
    success: false,
    message: error.message || "Something went wrong!",
  });
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully");
  mongoose.connection.close(() => {
    console.log("MongoDB connection closed");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  console.log("SIGINT received, shutting down gracefully");
  mongoose.connection.close(() => {
    console.log("MongoDB connection closed");
    process.exit(0);
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`📡 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📖 API info: http://localhost:${PORT}/api`);
  //console.log(`🎯 Stake API: http://localhost:${PORT}/api/stakes`);
});
