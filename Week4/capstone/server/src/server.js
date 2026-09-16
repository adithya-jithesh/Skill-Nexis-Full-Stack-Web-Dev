import "dotenv/config";
import { createServer } from "node:http";
import cors from "cors";
import express from "express";
import { connectDB } from "./config/db.js";
import { ensureUploadDir, UPLOAD_DIR } from "./config/paths.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";
import authRoutes from "./routes/authRoutes.js";
import commentRoutes from "./routes/commentRoutes.js";
import postRoutes from "./routes/postRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import { initRealtime } from "./realtime.js";

const app = express();

// Render (and every other host) hands the port to the process rather than
// letting it choose - so this reads the environment first and only falls back
// to 5006 for local work.
const PORT = process.env.PORT || 5006;

// One origin locally, but a deployed site has at least two worth allowing:
// the real domain and the preview URLs. A comma-separated list keeps that in
// configuration instead of in the code.
const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:5176")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      // No origin at all means a server-to-server call or a tool like curl,
      // which CORS does not apply to.
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);

      // An origin that is not on the list is refused by *omitting* the
      // Access-Control-Allow-Origin header, not by raising an error. Throwing
      // here sends the request down the error handler, which answers 500 - and
      // a stranger's origin is not a fault in this server, it is the policy
      // working. It also filled the logs with 500s and made every preflight
      // from a preview URL look like an outage.
      //
      // Worth being clear about what this does and does not do: CORS is a rule
      // the *browser* enforces, so this stops a page on another domain from
      // reading the response. It is not access control - curl and Postman
      // ignore all of it. What actually protects anything here is the JWT.
      callback(null, false);
    },
  })
);

app.use(express.json());

// The uploaded images. Static files, not behind the token: a filename is 32
// random hex characters, and putting them behind auth would mean every <img>
// needed a header. maxAge is safe because those names are never reused.
app.use("/uploads", express.static(UPLOAD_DIR, { maxAge: "7d" }));

// What a host pings to decide whether this instance is alive. It deliberately
// does no database work, so a slow query cannot make the service look dead.
app.get("/api/health", (req, res) => {
  res.json({ success: true, status: "ok", uptime: Math.round(process.uptime()) });
});

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Social Feed API - SkillNexis Week 4 capstone",
    endpoints: {
      "POST   /api/auth/register": "create an account, returns a JWT",
      "POST   /api/auth/login": "log in with email or username",
      "GET    /api/auth/me": "the logged-in account",
      "PUT    /api/auth/me": "change your name or bio",
      "POST   /api/auth/me/avatar": "upload an avatar (field 'avatar')",
      "GET    /api/posts": "timeline (?scope=following ?username= ?page=)",
      "POST   /api/posts": "write a post (optional image, field 'image')",
      "GET    /api/posts/:id": "one post",
      "DELETE /api/posts/:id": "delete your own post",
      "POST   /api/posts/:id/like": "like or unlike",
      "GET    /api/posts/:id/likes": "who liked it",
      "GET    /api/posts/:id/comments": "the thread under a post",
      "POST   /api/posts/:id/comments": "reply to a post",
      "DELETE /api/comments/:id": "delete your comment, or one on your post",
      "GET    /api/users": "find people (?search=)",
      "GET    /api/users/:username": "a profile",
      "POST   /api/users/:username/follow": "follow or unfollow",
      "GET    /api/users/:username/followers": "their followers",
      "GET    /api/users/:username/following": "who they follow",
    },
    realtime: "Socket.IO on the same port - post:new, post:counts, comment:new, presence",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/users", userRoutes);

app.use(notFound);
app.use(errorHandler);

// Refuse to start on the placeholder secret - a predictable secret means
// anyone can forge a token for any account. This matters more here than in
// the earlier weeks, because this one is meant to be deployed.
if (!process.env.JWT_SECRET || process.env.JWT_SECRET === "change-me-to-a-long-random-string") {
  console.error("JWT_SECRET is missing or still the placeholder. Set a real one in .env.");
  process.exit(1);
}

if (!process.env.MONGODB_URI) {
  console.error("MONGODB_URI is missing. Set it in .env (or in the host's environment).");
  process.exit(1);
}

try {
  ensureUploadDir();
  await connectDB(process.env.MONGODB_URI);

  // Socket.IO needs the HTTP server rather than the Express app, because it
  // upgrades the connection rather than handling a request - so the listening
  // is done here instead of by app.listen(). Same port either way, which is
  // what lets one hosted service serve both.
  const httpServer = createServer(app);
  initRealtime(httpServer, allowedOrigins);

  httpServer.listen(PORT, () => {
    console.log("Server listening on http://localhost:" + PORT);
    console.log("Allowed origins:", allowedOrigins.join(", "));
    console.log("Socket.IO ready on the same port");
  });
} catch (error) {
  console.error("Could not start the server:", error.message);
  process.exit(1);
}
