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
    // The file on disk, uploaded through Multer. Empty until one is picked,
    // and the client falls back to drawing the user's initials.
    avatar: {
      type: String,
      default: "",
    },
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

// What a user looks like in a response: no password, no __v. The avatar goes
// out as a URL, since where the files are served from is the server's
// business, not the client's.
userSchema.methods.toPublicJSON = function toPublicJSON() {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    avatarUrl: this.avatar ? "/uploads/" + this.avatar : "",
    createdAt: this.createdAt,
  };
};

const User = mongoose.model("User", userSchema);

export default User;
