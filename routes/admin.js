import { Router } from "express";
import { login, logout, signup } from "../controllers/adminController.js";

const routes = Router();

routes.route("/register").post(signup);
routes.route("/login").post(login);
routes.route("/logout").post(logout

    
);


export default routes
