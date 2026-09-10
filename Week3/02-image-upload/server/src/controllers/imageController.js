import fs from "node:fs/promises";
import path from "node:path";
import { UPLOAD_DIR } from "../config/paths.js";
import Image from "../models/Image.js";

// POST /api/images - multipart/form-data with a file field called "image"
// and an optional caption.
export async function uploadImage(req, res) {
  // Multer put the file here. Nothing arrives when the request had no file
  // part at all, which is a client mistake rather than a server error.
  if (!req.file) {
    res.status(400);
    throw new Error("No image was sent. Use a form field called 'image'.");
  }

  try {
    const image = await Image.create({
      filename: req.file.filename,
      originalName: req.file.originalname,
      caption: req.body.caption,
      mimeType: req.file.mimetype,
      size: req.file.size,
    });

    res.status(201).json({ success: true, data: image });
  } catch (error) {
    // The file is already on disk by the time the record is written. If the
    // record fails - a caption over the limit, say - the file would sit
    // there forever with nothing pointing at it, so delete it again.
    await fs.unlink(path.join(UPLOAD_DIR, req.file.filename)).catch(() => {});
    throw error;
  }
}

// GET /api/images - newest first, which is what a gallery wants.
export async function getImages(req, res) {
  const images = await Image.find().sort({ createdAt: -1 });

  res.json({ success: true, count: images.length, data: images });
}

// GET /api/images/:id
export async function getImage(req, res) {
  const image = await Image.findById(req.params.id);

  if (!image) {
    res.status(404);
    throw new Error("No image found with id " + req.params.id);
  }

  res.json({ success: true, data: image });
}

// DELETE /api/images/:id - removes the record and the file.
export async function deleteImage(req, res) {
  const image = await Image.findByIdAndDelete(req.params.id);

  if (!image) {
    res.status(404);
    throw new Error("No image found with id " + req.params.id);
  }

  // The path is built from the stored filename, which Multer generated - the
  // name the browser sent is never used here.
  await fs.unlink(path.join(UPLOAD_DIR, image.filename)).catch(() => {
    // Already gone. The record is what mattered, so this is not an error
    // worth failing the request over.
  });

  res.json({ success: true, message: "Image deleted.", data: { id: image._id } });
}
