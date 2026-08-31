import mongoose from "mongoose";

const noteSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "A note needs a title."],
      trim: true,
      minlength: [2, "Title must be at least 2 characters."],
      maxlength: [120, "Title cannot be longer than 120 characters."],
    },
    content: {
      type: String,
      default: "",
      trim: true,
      maxlength: [10000, "Content cannot be longer than 10000 characters."],
    },
    tags: {
      type: [String],
      default: [],
      // Tags are stored lowercase and trimmed, so "React", "react " and
      // "react" all end up as the same tag when filtering.
      set: (tags) =>
        Array.isArray(tags)
          ? tags.map((tag) => String(tag).trim().toLowerCase()).filter(Boolean)
          : tags,
    },
    pinned: {
      type: Boolean,
      default: false,
    },
    // Which user the note belongs to. This is what makes the notes private:
    // every query in the controller filters on it.
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true, // notes are always looked up by owner, so index that field
    },
  },
  { timestamps: true }
);

const Note = mongoose.model("Note", noteSchema);

export default Note;
