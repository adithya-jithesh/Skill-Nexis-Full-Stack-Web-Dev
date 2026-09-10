import { Router } from "express";
import {
  createTask,
  deleteTask,
  getStats,
  getTask,
  getTasks,
  toggleTask,
  updateTask,
} from "../controllers/taskController.js";
import { protect } from "../middleware/auth.js";

const router = Router();

// Applied to every route below, so none of them can be reached without a
// valid token - including any route added later.
router.use(protect);

// This has to come before /:id, or "stats" would be read as an id.
router.get("/stats", getStats);

router.route("/").get(getTasks).post(createTask);
router.route("/:id").get(getTask).put(updateTask).delete(deleteTask);
router.patch("/:id/toggle", toggleTask);

export default router;
