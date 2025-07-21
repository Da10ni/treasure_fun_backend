import { Router } from "express";
import { getProfile, login, logout, signup, updateProfile } from "../controllers/adminController.js";
import { authenticateToken } from "../middleware/auth.js";

const routes = Router();

routes.route("/register").post(signup);
routes.route("/login").post(login);
routes.route("/logout").post(logout);
routes.route("/update/:id").post(updateProfile);
routes.route("/:id").get(getProfile);

export default routes;
