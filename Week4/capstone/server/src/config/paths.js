import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// ES modules have no __dirname, so it is rebuilt from import.meta.url. Paths
// are worked out from this file rather than from process.cwd(), so the server
// finds its uploads folder whichever directory it was started from.
const here = path.dirname(fileURLToPath(import.meta.url));

// Configurable, because a hosted server usually keeps uploads somewhere other
// than inside the deployed code - on Render that means a mounted disk, whose
// path is set through the environment. Locally it falls back to ./uploads.
export const UPLOAD_DIR = process.env.UPLOAD_DIR
  ? path.resolve(process.env.UPLOAD_DIR)
  : path.resolve(here, "../../uploads");

// Multer will not create the folder itself - it errors if it is missing.
export function ensureUploadDir() {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}
