import "dotenv/config";
import cors from "cors";
import express from "express";
import { connectDB } from "./config/db.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";
import authRoutes from "./routes/authRoutes.js";
import noteRoutes from "./routes/noteRoutes.js";

const app = express();
const PORT = process.env.PORT || 5002;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Notes App Backend - SkillNexis Week 2, mini project",
    endpoints: {
      "POST   /api/auth/register": "create an account, returns a JWT",
      "POST   /api/auth/login": "log in, returns a JWT",
      "GET    /api/auth/me": "the logged-in user",
      "GET    /api/notes": "your notes (?search=  ?tag=  ?pinned=true)",
      "GET    /api/notes/tags": "your tags, with counts",
      "GET    /api/notes/:id": "one note",
      "POST   /api/notes": "create a note",
      "PUT    /api/notes/:id": "update a note",
      "PATCH  /api/notes/:id/pin": "flip pinned",
      "DELETE /api/notes/:id": "delete a note",
    },
    note: "Everything under /api/notes needs: Authorization: Bearer <token>",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/notes", noteRoutes);

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
