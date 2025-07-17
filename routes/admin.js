import { Router } from "express";
import { signup } from "../controllers/adminController.js";

const routes = Router();

routes.route("/register").post(signup);


export default routes
