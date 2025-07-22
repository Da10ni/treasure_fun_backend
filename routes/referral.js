import { Router } from "express";
import { createReferralPercentage } from "../controllers/referralController.js";
import { authenticateToken } from "../middleware/auth.js";

const routes = Router();

routes.route("/create-referral").post(authenticateToken, createReferralPercentage)

export default routes