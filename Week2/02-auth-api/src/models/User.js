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
      unique: true, // MongoDB refuses a second user with the same email
      lowercase: true, // so Adi@x.com and adi@x.com are the same account
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/, "Enter a valid email address."],
    },
    password: {
      type: String,
      required: [true, "Password is required."],
      minlength: [8, "Password must be at least 8 characters."],
      // select: false keeps the hash out of every query result unless it is
      // asked for explicitly, so it cannot leak into a response by accident.
      select: false,
    },
  },
  { timestamps: true }
);

// Runs automatically before a user is saved. The plain password never
// reaches the database - only the bcrypt hash does.
// An async hook does not take a next callback: Mongoose waits for the
// promise this returns.
userSchema.pre("save", async function hashPassword() {
  // Only re-hash when the password actually changed, otherwise updating a
  // name would hash the existing hash a second time.
  if (!this.isModified("password")) return;

  // The salt is random per user, so two people with the same password get
  // different hashes. 10 rounds is the usual default: slow enough to make
  // brute forcing expensive, fast enough for a login request.
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compares a typed password with the stored hash. bcrypt re-hashes the
// attempt with the same salt and compares - the hash is never reversed.
userSchema.methods.matchesPassword = function matchesPassword(plainPassword) {
  return bcrypt.compare(plainPassword, this.password);
};

// What a user looks like in a response: no password, no __v.
userSchema.methods.toPublicJSON = function toPublicJSON() {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    createdAt: this.createdAt,
  };
};

const User = mongoose.model("User", userSchema);

export default User;
