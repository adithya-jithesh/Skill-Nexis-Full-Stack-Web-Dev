import "dotenv/config";
import cors from "cors";
import express from "express";
import { connectDB } from "./config/db.js";
import { ensureUploadDir, UPLOAD_DIR } from "./config/paths.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";
import authRoutes from "./routes/authRoutes.js";
import taskRoutes from "./routes/taskRoutes.js";

const app = express();
const PORT = process.env.PORT || 5005;

app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5175" }));
app.use(express.json());

// The uploaded avatars. Static files, so they are not behind the token:
// a filename is 32 random hex characters, which is not guessable, and
// putting them behind auth would mean every <img> needed a header.
app.use("/uploads", express.static(UPLOAD_DIR, { maxAge: "1d" }));

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Task Manager API - SkillNexis Week 3, mini project",
    endpoints: {
      "POST   /api/auth/register": "create an account, returns a JWT",
      "POST   /api/auth/login": "log in, returns a JWT",
      "GET    /api/auth/me": "the logged-in user",
      "PUT    /api/auth/me": "change your name",
      "POST   /api/auth/me/avatar": "upload an avatar (field 'avatar')",
      "GET    /api/tasks": "your tasks (?status= ?priority= ?tag= ?search= ?due= ?sort= ?page=)",
      "GET    /api/tasks/stats": "counts for the dashboard",
      "GET    /api/tasks/tags": "your tags, with counts",
      "GET    /api/tasks/:id": "one task",
      "POST   /api/tasks": "create a task",
      "PUT    /api/tasks/:id": "update a task",
      "PATCH  /api/tasks/:id/status": "move it to todo, doing or done",
      "DELETE /api/tasks/:id": "delete a task",
    },
    note: "Everything under /api/tasks needs: Authorization: Bearer <token>",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);

app.use(notFound);
app.use(errorHandler);

// Refuse to start on the placeholder secret - a predictable secret means
// anyone can forge a token for any account.
if (!process.env.JWT_SECRET || process.env.JWT_SECRET === "change-me-to-a-long-random-string") {
  console.error("JWT_SECRET is missing or still the placeholder. Set a real one in .env.");
  process.exit(1);
}

try {
  ensureUploadDir();
  await connectDB(process.env.MONGODB_URI);
  app.listen(PORT, () => {
    console.log("Server listening on http://localhost:" + PORT);
  });
} catch (error) {
  console.error("Could not start the server:", error.message);
  process.exit(1);
}
