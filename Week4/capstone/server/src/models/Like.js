import mongoose from "mongoose";

// One row per person per post. Storing likes as their own collection rather
// than an array on the post keeps a popular post's document small, and makes
// "has this user liked this?" an indexed lookup instead of scanning an array.
const likeSchema = new mongoose.Schema(
  {
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

// The important line in this file. A unique compound index means the database
// itself refuses a second like from the same person on the same post - two
// requests racing each other cannot both win, which a check-then-insert in
// the controller could not guarantee on its own.
likeSchema.index({ post: 1, user: 1 }, { unique: true });

const Like = mongoose.model("Like", likeSchema);

export default Like;
