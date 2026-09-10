import mongoose from "mongoose";

// The Week 2 task schema, with one field added: owner. That single field is
// what turns a shared list into one list per account.
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
      maxlength: [500, "Description cannot be longer than 500 characters."],
    },
    completed: {
      type: Boolean,
      default: false,
    },
    priority: {
      // enum means only these three strings are allowed.
      type: String,
      enum: {
        values: ["low", "medium", "high"],
        message: "Priority must be low, medium or high.",
      },
      default: "medium",
    },
    dueDate: {
      type: Date,
      default: null,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true, // tasks are always looked up by owner, so index that field
    },
  },
  // timestamps adds createdAt and updatedAt and keeps them up to date.
  { timestamps: true }
);

const Task = mongoose.model("Task", taskSchema);

export default Task;
