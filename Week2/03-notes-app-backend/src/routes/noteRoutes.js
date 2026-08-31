import { Router } from "express";
import {
  createNote,
  deleteNote,
  getNote,
  getNotes,
  getTags,
  togglePin,
  updateNote,
} from "../controllers/noteController.js";
import { protect } from "../middleware/auth.js";

const router = Router();

// Applied to every route below, so none of them can be reached without a
// valid token. Guarding the whole router is safer than remembering to add
// protect to each line - a route added later is protected by default.
router.use(protect);

// This has to come before /:id, or "tags" would be read as an id.
router.get("/tags", getTags);

router.route("/").get(getNotes).post(createNote);
router.route("/:id").get(getNote).put(updateNote).delete(deleteNote);
router.patch("/:id/pin", togglePin);

export default router;
