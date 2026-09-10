import { Router } from "express";
import { deleteComment } from "../controllers/commentController.js";
import { protect } from "../middleware/auth.js";

// Comments are created and listed under their post, but deleting one only
// needs the comment's own id - so that route lives here rather than nested.
const router = Router();

router.delete("/:id", protect, deleteComment);

export default router;
