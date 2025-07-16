import express from "express";
import {
  createStake,
  getAllStakes,
  getStakeById,
  updateStakeById,
  deleteStakeById,
  getStakesByUser,
  getStakeStats,
} from "../controllers/stakeController.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Stake statistics route
router.get("/stats", getStakeStats);

// Get user's own stakes
router.get(
  "/my-stakes",
  (req, res, next) => {
    req.params.userId = req.userId;
    next();
  },
  getStakesByUser
);

// Get stakes by specific user ID
router.get("/user/:userId", getStakesByUser);

// Get all stakes with filtering and pagination
router.get("/", getAllStakes);

// Create new stake
router.post("/", createStake);

// Get specific stake by ID (MongoDB ID or Stake ID)
router.get("/:id", getStakeById);

// Update stake by ID
router.put("/:id", updateStakeById);

// Delete stake by ID
router.delete("/:id", deleteStakeById);

export default router;
