import express from "express";
import { authenticateUser, authenticateAdmin } from "../middleware/auth.js";
import { getAllStakes, getUserStakes, handleStake } from "../controllers/stake.controller.js";

const router = express.Router();

router.post('/create', authenticateUser, handleStake);
router.get("/user/:userId", authenticateUser, getUserStakes);
router.get("/admin", authenticateAdmin, getAllStakes);

export default router;