import { Router } from "express";
import { authenticateAdmin } from "../middleware/auth.js";
import {
  createNotification,
  getNotification,
} from "../controllers/notificationController.js";

const routes = Router();

routes
  .route("/create-notification")
  .post(authenticateAdmin, createNotification);
routes.route("/get-notification").get(getNotification);

export default routes;
