import { Router } from "express";
import {
  getFollowers,
  getFollowing,
  getUser,
  getUsers,
  toggleFollow,
} from "../controllers/userController.js";
import { optionalAuth, protect } from "../middleware/auth.js";

const router = Router();

// Profiles are public. optionalAuth means a logged-in visitor also gets
// "followedByMe" and "isMe" on the same response.
router.get("/", optionalAuth, getUsers);
router.get("/:username", optionalAuth, getUser);
router.get("/:username/followers", getFollowers);
router.get("/:username/following", getFollowing);

// Following someone is not.
router.post("/:username/follow", protect, toggleFollow);

export default router;
