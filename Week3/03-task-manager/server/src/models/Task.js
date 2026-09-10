import mongoose from "mongoose";

// A task manager needs more than done/not done: something can be started
// without being finished, which is the difference between this and the
// to-do app in assignment 1.
export const STATUSES = ["todo", "doing", "done"];
export const PRIORITIES = ["low", "medium", "high"];

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "A task needs a title."],
      trim: true,
      minlength: [2, "Title must be at least 2 characters."],
      maxlength: [120, "Title cannot be longer than 120 characters."],
    },
    description: {
      type: String,
      default: "",
      trim: true,
      maxlength: [1000, "Description cannot be longer than 1000 characters."],
    },
    status: {
      type: String,
      enum: {
        values: STATUSES,
        message: "Status must be todo, doing or done.",
      },
      default: "todo",
    },
    priority: {
      type: String,
      enum: {
        values: PRIORITIES,
        message: "Priority must be low, medium or high.",
      },
      default: "medium",
    },
    dueDate: {
      type: Date,
      default: null,
    },
    tags: {
      type: [String],
      default: [],
      // Stored lowercase and trimmed, so "Work", "work " and "work" are the
      // same tag when filtering.
      set: (tags) =>
        Array.isArray(tags)
          ? tags.map((tag) => String(tag).trim().toLowerCase()).filter(Boolean)
          : tags,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

// Every list is "this user's tasks, in some order". A compound index covers
// the filter and the usual sort together.
taskSchema.index({ owner: 1, status: 1, dueDate: 1 });

const Task = mongoose.model("Task", taskSchema);

export default Task;
