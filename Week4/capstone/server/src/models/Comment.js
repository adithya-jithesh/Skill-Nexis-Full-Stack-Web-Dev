import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
  {
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      required: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: {
      type: String,
      required: [true, "A comment cannot be empty."],
      trim: true,
      maxlength: [280, "A comment cannot be longer than 280 characters."],
    },
  },
  { timestamps: true }
);

// Comments are always read as "this post's comments, oldest first" - a thread
// reads in the order it was written, unlike the feed.
commentSchema.index({ post: 1, createdAt: 1 });

const Comment = mongoose.model("Comment", commentSchema);

export default Comment;
