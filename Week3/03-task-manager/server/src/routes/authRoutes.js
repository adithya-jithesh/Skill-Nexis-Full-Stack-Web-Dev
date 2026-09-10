import { Router } from "express";
import { getMe, login, register, updateMe, uploadAvatar } from "../controllers/authController.js";
import { protect } from "../middleware/auth.js";
import { upload, uploadErrors } from "../middleware/upload.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);

router.route("/me").get(protect, getMe).put(protect, updateMe);

// protect runs first: an upload should be rejected before Multer writes
// anything to disk, not after.
router.post("/me/avatar", protect, upload.single("avatar"), uploadErrors, uploadAvatar);

export default router;
