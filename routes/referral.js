import { Router } from "express";
import { createReferralPercentage, getReferralPercentage } from "../controllers/referralController.js";
import { authenticateAdmin } from "../middleware/auth.js";

const routes = Router();

routes.route("/create-referral").post(authenticateAdmin, createReferralPercentage)
routes.route("/get-referral").get(authenticateAdmin, getReferralPercentage)

export default routes