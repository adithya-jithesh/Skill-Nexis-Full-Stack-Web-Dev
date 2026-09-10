import bcrypt from "bcryptjs";
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required."],
      trim: true,
      minlength: [2, "Name must be at least 2 characters."],
      maxlength: [60, "Name cannot be longer than 60 characters."],
    },
    // What people are known by on the site: it is in URLs and @mentions, so
    // it is lowercase, unique, and restricted to characters that survive a
    // URL untouched.
    username: {
      type: String,
      required: [true, "Username is required."],
      unique: true,
      lowercase: true,
      trim: true,
      minlength: [3, "Username must be at least 3 characters."],
      maxlength: [20, "Username cannot be longer than 20 characters."],
      match: [
        /^[a-z0-9_]+$/,
        "Username can only contain letters, numbers and underscores.",
      ],
    },
    email: {
      type: String,
      required: [true, "Email is required."],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/, "Enter a valid email address."],
    },
    password: {
      type: String,
      required: [true, "Password is required."],
      minlength: [8, "Password must be at least 8 characters."],
      select: false,
    },
    bio: {
      type: String,
      default: "",
      trim: true,
      maxlength: [160, "Bio cannot be longer than 160 characters."],
    },
    avatar: {
      type: String,
      default: "",
    },
    // Kept on the user and updated with $inc rather than counted on every
    // read. A profile shows these numbers on every visit; counting two
    // collections each time is work that never changes between follows.
    followerCount: { type: Number, default: 0, min: 0 },
    followingCount: { type: Number, default: 0, min: 0 },
    postCount: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

// The plain password never reaches the database - only the bcrypt hash does.
userSchema.pre("save", async function hashPassword() {
  if (!this.isModified("password")) return;

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.matchesPassword = function matchesPassword(plainPassword) {
  return bcrypt.compare(plainPassword, this.password);
};

// What a user looks like in a response: no password, no __v. Unlike the
// earlier weeks this is public - anyone can see anyone's profile - so it
// deliberately leaves the email out. Only /api/auth/me adds that back.
userSchema.methods.toPublicJSON = function toPublicJSON() {
  return {
    id: this._id,
    name: this.name,
    username: this.username,
    bio: this.bio,
    avatarUrl: this.avatar ? "/uploads/" + this.avatar : "",
    followerCount: this.followerCount,
    followingCount: this.followingCount,
    postCount: this.postCount,
    createdAt: this.createdAt,
  };
};

// The private version, for the account that owns it.
userSchema.methods.toPrivateJSON = function toPrivateJSON() {
  return { ...this.toPublicJSON(), email: this.email };
};

const User = mongoose.model("User", userSchema);

export default User;
