import { Router } from "express";
import {
    getActiveUsers,
    getProfile,
    login,
    logout,
    signup,
    updateProfile
} from "../controllers/adminController.js";
import { authenticateAdmin } from "../middleware/auth.js";
import { checkAuth } from "../controllers/authController.js";

const routes = Router();

// =============================================
// PUBLIC ROUTES (No Authentication Required)
// =============================================
routes.route("/register").post(signup);    // Admin signup - public
routes.route("/login").post(login);        // Admin login - public
routes.get('/check-admin', authenticateAdmin, checkAuth);

// =============================================
// ADMIN-ONLY ROUTES (authenticateAdmin)
// =============================================
routes.route("/logout").post(authenticateAdmin, logout);                    // Admin logout
routes.route("/getactiveuser").get(getActiveUsers);      // Admin viewing user data
routes.route("/update/:id").post(authenticateAdmin, updateProfile);         // Admin update own profile
routes.route("/:id").get(authenticateAdmin, getProfile);                   // Admin get own profile

// =============================================
// ADMIN ROUTES THAT MIGHT ACCESS USER DATA
// =============================================
// Note: getActiveUsers - Admin wants to see active users, so Admin middleware is correct

export default routes;