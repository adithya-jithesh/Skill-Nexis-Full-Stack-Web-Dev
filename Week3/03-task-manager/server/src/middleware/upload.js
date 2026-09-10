import crypto from "node:crypto";
import path from "node:path";
import multer from "multer";
import { UPLOAD_DIR } from "../config/paths.js";

// A normal form posts JSON, which Express can parse itself. A file upload is
// multipart/form-data, which it cannot - that is what Multer is for. It reads
// the parts, writes the file, and leaves the rest of the fields on req.body
// and the file on req.file.

// Files are written to disk. The alternative is memory storage, which is
// fine for something you immediately resize or forward, but a plain gallery
// only wants the file on disk with a name it can serve.
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),

  filename: (req, file, cb) => {
    // Never reuse the name the browser sent. Two people uploading photo.jpg
    // would overwrite each other, and a crafted name like "../../server.js"
    // would write outside the uploads folder. A random name from a fixed
    // alphabet cannot do either.
    const extension = path.extname(file.originalname).toLowerCase();
    cb(null, crypto.randomBytes(16).toString("hex") + extension);
  },
});

// What counts as an image. The browser's own type is not trusted on its own,
// so the extension has to agree with it.
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
    // Rejecting with an error rather than cb(null, false), so the route can
    // say why instead of just finding no file on the request.
    return cb(new Error("Only JPEG, PNG, GIF and WebP images can be uploaded."));
  }

  cb(null, true);
}

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 1024 * 1024, // 1 MB - an avatar does not need more
    files: 1,
  },
});

// Multer throws its own error type, and its messages ("File too large") are
// too terse to show a user. This turns them into the same JSON shape as the
// rest of the API, with a status code that fits.
export function uploadErrors(err, req, res, next) {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      res.status(413);
      return next(new Error("That image is larger than the 1 MB limit for avatars."));
    }

    if (err.code === "LIMIT_FILE_COUNT" || err.code === "LIMIT_UNEXPECTED_FILE") {
      res.status(400);
      return next(new Error("Send one image, in a field called 'avatar'."));
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
}
