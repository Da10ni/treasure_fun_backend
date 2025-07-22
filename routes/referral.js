import { Router } from "express";
import { createReferralPercentage } from "../controllers/referralController.js";
import { authenticateAdmin } from "../middleware/auth.js";

const routes = Router();

routes.route("/create-referral").post(authenticateAdmin, createReferralPercentage)

export default routes