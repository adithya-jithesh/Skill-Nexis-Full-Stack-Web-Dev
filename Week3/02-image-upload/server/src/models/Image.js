import mongoose from "mongoose";

// The file itself lives on disk; this is the record of it. Storing the bytes
// in MongoDB would work for small images, but a document has a 16 MB ceiling
// and the database ends up doing a web server's job.
const imageSchema = new mongoose.Schema(
  {
    // The random name on disk. This is what the URL points at.
    filename: {
      type: String,
      required: true,
      unique: true,
    },
    // The name the file had on the uploader's computer. Kept for display
    // only - it is never used to build a path.
    originalName: {
      type: String,
      required: true,
      trim: true,
    },
    caption: {
      type: String,
      default: "",
      trim: true,
      maxlength: [140, "Caption cannot be longer than 140 characters."],
    },
    mimeType: {
      type: String,
      required: true,
    },
    size: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

// The client needs a URL, not a filename, and where the files are served from
// is the server's business. A virtual keeps that decision here: change the
// static route and every response follows.
imageSchema.virtual("url").get(function url() {
  return "/uploads/" + this.filename;
});

// Virtuals are not included when a document is turned into JSON unless this
// is switched on.
imageSchema.set("toJSON", { virtuals: true });

const Image = mongoose.model("Image", imageSchema);

export default Image;
