import "dotenv/config";
import cors from "cors";
import express from "express";
import { connectDB } from "./config/db.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";
import taskRoutes from "./routes/taskRoutes.js";

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

// Middleware runs on every request, in the order it is added here.
app.use(cors()); // let a browser front end call this API
app.use(express.json()); // parse a JSON request body into req.body

// A quick way to check the server is alive without touching the database.
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "To-Do List REST API - SkillNexis Week 2, assignment 1",
    endpoints: {
      "GET    /api/tasks": "list tasks (?completed=true&priority=high)",
      "GET    /api/tasks/:id": "one task",
      "POST   /api/tasks": "create a task",
      "PUT    /api/tasks/:id": "update a task",
      "PATCH  /api/tasks/:id/toggle": "flip completed",
      "DELETE /api/tasks/:id": "delete a task",
    },
  });
});

app.use("/api/tasks", taskRoutes);

// These two go last: notFound catches URLs nothing matched, and
// errorHandler catches every error thrown above it.
app.use(notFound);
app.use(errorHandler);

// Connect to MongoDB first. There is no point listening for requests we
// cannot answer, so a failed connection stops the server instead.
try {
  await connectDB(MONGODB_URI);
  app.listen(PORT, () => {
    console.log("Server listening on http://localhost:" + PORT);
  });
} catch (error) {
  console.error("Could not start the server:", error.message);
  process.exit(1);
}
