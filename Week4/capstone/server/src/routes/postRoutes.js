import { Router } from "express";
import { createComment, getComments } from "../controllers/commentController.js";
import {
  createPost,
  deletePost,
  getLikes,
  getPost,
  getPosts,
  toggleLike,
} from "../controllers/postController.js";
import { optionalAuth, protect } from "../middleware/auth.js";
import { imageUpload, POST_IMAGE_LIMIT, uploadErrors } from "../middleware/upload.js";

const router = Router();

// Reading is public - a feed nobody can see before signing up is a poor
// advertisement for itself. optionalAuth still attaches the viewer when a
// token is sent, which is what fills in "have you liked this?".
router
  .route("/")
  .get(optionalAuth, getPosts)
  .post(
    protect,
    imageUpload(POST_IMAGE_LIMIT).single("image"),
    uploadErrors(POST_IMAGE_LIMIT, "image"),
    createPost
  );

router.route("/:id").get(optionalAuth, getPost).delete(protect, deletePost);

router.post("/:id/like", protect, toggleLike);
router.get("/:id/likes", getLikes);

router.route("/:id/comments").get(getComments).post(protect, createComment);

export default router;
