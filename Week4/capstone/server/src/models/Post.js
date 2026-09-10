import mongoose from "mongoose";

const postSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    text: {
      type: String,
      required: [true, "A post needs something to say."],
      trim: true,
      maxlength: [500, "A post cannot be longer than 500 characters."],
    },
    // Optional: a post is text, with a picture if you want one.
    image: {
      type: String,
      default: "",
    },
    // Counted here rather than by counting the likes and comments collections
    // on every read. A feed of twenty posts would otherwise be forty extra
    // queries; these two numbers are kept in step with $inc wherever a like
    // or comment is created or removed.
    likeCount: { type: Number, default: 0, min: 0 },
    commentCount: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

// The feed is "posts by these authors, newest first", and a profile is the
// same query with one author. This index covers both.
postSchema.index({ author: 1, createdAt: -1 });

// The public timeline is every post, newest first.
postSchema.index({ createdAt: -1 });

const Post = mongoose.model("Post", postSchema);

export default Post;
