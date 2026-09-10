import mongoose from "mongoose";

// Who follows whom. A separate collection rather than two arrays on the user,
// for the same reason as likes: an account with 50,000 followers should not
// carry a 50,000-element array in every document read.
const followSchema = new mongoose.Schema(
  {
    // The person doing the following.
    follower: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // The person being followed.
    following: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

// Following someone twice is meaningless, so the database refuses it.
followSchema.index({ follower: 1, following: 1 }, { unique: true });

// "Who does this person follow" builds the feed; "who follows this person"
// fills the followers list. The unique index above covers the first, this
// covers the second.
followSchema.index({ following: 1, createdAt: -1 });

const Follow = mongoose.model("Follow", followSchema);

export default Follow;
