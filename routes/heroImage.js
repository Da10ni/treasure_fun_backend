import { Router } from "express";
import { authenticateAdmin } from "../middleware/auth.js";
import {
  createHeroImage,
  createVideo,
  deleteHeroImage,
  deleteVideo,
  getHeroImage,
  getVideo,
} from "../controllers/heroImageController.js";
import { upload } from "../middleware/multer.js";

const routes = Router();

routes
  .route("/create-image")
  .post(authenticateAdmin, upload.single("heroImage"), createHeroImage);
routes
  .route("/create-video")
  .post(authenticateAdmin, upload.single("video"), createVideo);
routes.route("/get-image").get(getHeroImage);
routes.route("/get-video").get(getVideo);
routes.route("/delete-image/:id").delete(authenticateAdmin, deleteHeroImage);
routes.route("/delete-video/:id").delete(authenticateAdmin, deleteVideo);

export default routes;
