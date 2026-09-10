import { Router } from "express";
import {
  createTask,
  deleteTask,
  getStats,
  getTags,
  getTask,
  getTasks,
  setStatus,
  updateTask,
} from "../controllers/taskController.js";
import { protect } from "../middleware/auth.js";

const router = Router();

// Applied to every route below, so none of them can be reached without a
// valid token - including any route added later.
router.use(protect);

// These two have to come before /:id, or "stats" and "tags" would be read
// as ids.
router.get("/stats", getStats);
router.get("/tags", getTags);

router.route("/").get(getTasks).post(createTask);
router.route("/:id").get(getTask).put(updateTask).delete(deleteTask);
router.patch("/:id/status", setStatus);

export default router;
