import crypto from "node:crypto";
import path from "node:path";
import multer from "multer";
import { UPLOAD_DIR } from "../config/paths.js";

// A form carrying a file is multipart/form-data, which express.json() cannot
// parse. Multer reads the parts, writes the file, and leaves the text fields
// on req.body and the file on req.file.
//
// Two things are uploaded here - avatars and post images - so this exports a
// factory rather than one instance: they differ only in the size allowed.

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),

  filename: (req, file, cb) => {
    // Never reuse the name the browser sent. Two people uploading photo.jpg
    // would overwrite each other, and a crafted name like "../../server.js"
    // would write outside the uploads folder. A random name from a fixed
    // alphabet can do neither.
    const extension = path.extname(file.originalname).toLowerCase();
    cb(null, crypto.randomBytes(16).toString("hex") + extension);
  },
});

// The browser can claim any MIME type, so the extension has to agree with it.
const ALLOWED = {
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/gif": [".gif"],
  "image/webp": [".webp"],
};

function fileFilter(req, file, cb) {
  const extensions = ALLOWED[file.mimetype];
  const extension = path.extname(file.originalname).toLowerCase();

  if (!extensions || !extensions.includes(extension)) {
    // An error rather than cb(null, false), so the route can say why instead
    // of just finding no file on the request.
    return cb(new Error("Only JPEG, PNG, GIF and WebP images can be uploaded."));
  }

  cb(null, true);
}

export function imageUpload(maxBytes) {
  return multer({ storage, fileFilter, limits: { fileSize: maxBytes, files: 1 } });
}

// An avatar is decoration; a post image is the point of the post, so it gets
// more room.
export const AVATAR_LIMIT = 1024 * 1024; // 1 MB
export const POST_IMAGE_LIMIT = 4 * 1024 * 1024; // 4 MB

// Multer throws its own error type with terse messages ("File too large").
// This turns them into the same JSON shape as the rest of the API, with a
// status that fits. The limit is passed in so the message can name it.
export function uploadErrors(maxBytes, field) {
  const readable = maxBytes >= 1024 * 1024 ? maxBytes / (1024 * 1024) + " MB" : maxBytes / 1024 + " KB";

  return (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        res.status(413);
        return next(new Error("That image is larger than the " + readable + " limit."));
      }

      if (err.code === "LIMIT_FILE_COUNT" || err.code === "LIMIT_UNEXPECTED_FILE") {
        res.status(400);
        return next(new Error("Send one image, in a field called '" + field + "'."));
      }

      res.status(400);
      return next(new Error(err.message));
    }

    // Anything the fileFilter rejected arrives here as a plain Error.
    if (err) {
      if (res.statusCode === 200) res.status(400);
      return next(err);
    }

    next();
  };
}
