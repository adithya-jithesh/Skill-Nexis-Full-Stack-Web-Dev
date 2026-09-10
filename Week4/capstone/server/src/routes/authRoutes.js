import { Router } from "express";
import { getMe, login, register, updateMe, uploadAvatar } from "../controllers/authController.js";
import { protect } from "../middleware/auth.js";
import { AVATAR_LIMIT, imageUpload, uploadErrors } from "../middleware/upload.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);

router.route("/me").get(protect, getMe).put(protect, updateMe);

// protect runs before Multer, so an upload from a stranger is refused before
// anything is written to disk rather than after.
router.post(
  "/me/avatar",
  protect,
  imageUpload(AVATAR_LIMIT).single("avatar"),
  uploadErrors(AVATAR_LIMIT, "avatar"),
  uploadAvatar
);

export default router;
