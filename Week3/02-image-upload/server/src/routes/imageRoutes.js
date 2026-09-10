import { Router } from "express";
import {
  deleteImage,
  getImage,
  getImages,
  uploadImage,
} from "../controllers/imageController.js";
import { upload, uploadErrors } from "../middleware/upload.js";

const router = Router();

router
  .route("/")
  .get(getImages)
  // single("image") accepts one file from a field called "image". It runs
  // before the controller, and uploadErrors sits between them so a rejected
  // file (too big, wrong type) becomes a JSON message rather than Multer's
  // own error reaching the generic handler.
  .post(upload.single("image"), uploadErrors, uploadImage);

router.route("/:id").get(getImage).delete(deleteImage);

export default router;
