import "dotenv/config";
import cors from "cors";
import express from "express";
import { connectDB } from "./config/db.js";
import { ensureUploadDir, UPLOAD_DIR } from "./config/paths.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";
import imageRoutes from "./routes/imageRoutes.js";

const app = express();
const PORT = process.env.PORT || 5004;

app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5174" }));
app.use(express.json());

// The uploaded files, served as plain static files. express.static only ever
// looks inside this one folder, so a request cannot climb out of it.
// maxAge is safe here because the filenames are random and never reused - a
// given URL always means the same image.
app.use("/uploads", express.static(UPLOAD_DIR, { maxAge: "1d" }));

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Image Upload API - SkillNexis Week 3, assignment 2",
    endpoints: {
      "POST   /api/images": "upload one image (multipart/form-data, field 'image')",
      "GET    /api/images": "every uploaded image, newest first",
      "GET    /api/images/:id": "one image record",
      "DELETE /api/images/:id": "delete the record and the file",
      "GET    /uploads/:filename": "the image itself",
    },
    limits: { maxSize: "2 MB", types: ["image/jpeg", "image/png", "image/gif", "image/webp"] },
  });
});

app.use("/api/images", imageRoutes);

app.use(notFound);
app.use(errorHandler);

try {
  // Multer errors if the destination folder is missing, and a fresh clone of
  // the repo will not have one - the uploads are gitignored.
  ensureUploadDir();
  await connectDB(process.env.MONGODB_URI);
  app.listen(PORT, () => {
    console.log("Server listening on http://localhost:" + PORT);
  });
} catch (error) {
  console.error("Could not start the server:", error.message);
  process.exit(1);
}
