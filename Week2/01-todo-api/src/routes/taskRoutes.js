import { Router } from "express";
import {
  getTasks,
  getTask,
  createTask,
  updateTask,
  toggleTask,
  deleteTask,
} from "../controllers/taskController.js";

// A Router is a mini app. server.js mounts it at /api/tasks, so the paths
// written here are relative to that.
const router = Router();

// REST design: the URL names the thing, the HTTP method says what to do
// with it. /api/tasks is the collection, /api/tasks/:id is one task.
router.route("/").get(getTasks).post(createTask);
router.route("/:id").get(getTask).put(updateTask).delete(deleteTask);
router.patch("/:id/toggle", toggleTask);

export default router;
