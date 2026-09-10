import "dotenv/config";
import cors from "cors";
import express from "express";
import { connectDB } from "./config/db.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";
import authRoutes from "./routes/authRoutes.js";
import taskRoutes from "./routes/taskRoutes.js";

const app = express();
const PORT = process.env.PORT || 5003;

// The front end runs on a different port, which makes every call to this API
// a cross-origin request. Week 2 allowed any origin because Postman was the
// only client; now that a browser is calling, the allowed origin is named.
app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173" }));
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Full Stack To-Do API - SkillNexis Week 3, assignment 1",
    endpoints: {
      "POST   /api/auth/register": "create an account, returns a JWT",
      "POST   /api/auth/login": "log in, returns a JWT",
      "GET    /api/auth/me": "the logged-in user",
      "GET    /api/tasks": "your tasks (?completed=  ?priority=  ?search=)",
      "GET    /api/tasks/stats": "counts for the dashboard",
      "GET    /api/tasks/:id": "one task",
      "POST   /api/tasks": "create a task",
      "PUT    /api/tasks/:id": "update a task",
      "PATCH  /api/tasks/:id/toggle": "flip completed",
      "DELETE /api/tasks/:id": "delete a task",
    },
    note: "Everything under /api/tasks needs: Authorization: Bearer <token>",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);

// Last: unmatched URLs, then anything that threw above.
app.use(notFound);
app.use(errorHandler);

// Refuse to start on the placeholder secret - a predictable secret means
// anyone can forge a token for any account.
if (!process.env.JWT_SECRET || process.env.JWT_SECRET === "change-me-to-a-long-random-string") {
  console.error("JWT_SECRET is missing or still the placeholder. Set a real one in .env.");
  process.exit(1);
}

try {
  await connectDB(process.env.MONGODB_URI);
  app.listen(PORT, () => {
    console.log("Server listening on http://localhost:" + PORT);
  });
} catch (error) {
  console.error("Could not start the server:", error.message);
  process.exit(1);
}
