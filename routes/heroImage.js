import { Router } from "express";
import { authenticateAdmin } from "../middleware/auth.js";
import {
  createHeroImage,
  deleteHeroImage,
  getHeroImage,
} from "../controllers/heroImageController.js";
import { upload } from "../middleware/multer.js";

const routes = Router();

routes
  .route("/create-image")
  .post(authenticateAdmin, upload.single("heroImage"), createHeroImage);
routes.route("/get-image").get(getHeroImage);
routes.route("/delete-image/:id").delete(authenticateAdmin, deleteHeroImage);

export default routes;
