import mongoose from "mongoose";

// The schema is the shape of a task, and where the rules live. Mongoose
// checks these rules before anything is written to MongoDB, so a bad
// request never reaches the database.
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
  },
  // timestamps adds createdAt and updatedAt and keeps them up to date.
  { timestamps: true }
);

const Task = mongoose.model("Task", taskSchema);

export default Task;
