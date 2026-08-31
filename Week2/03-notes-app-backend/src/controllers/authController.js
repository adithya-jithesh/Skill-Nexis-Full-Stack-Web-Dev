import jwt from "jsonwebtoken";
import User from "../models/User.js";

// Builds the token that proves who someone is. The payload only carries the
// user id - a JWT is signed, not encrypted, so anyone can read what is in it.
function signToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
}

// POST /api/auth/register
export async function register(req, res) {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    res.status(400);
    throw new Error("Name, email and password are all required.");
  }

  // Checked here so the client gets a clear 409 rather than relying on the
  // database's duplicate key error (which the error handler also catches,
  // in case two requests race each other).
  const existing = await User.findOne({ email: email.toLowerCase() });

  if (existing) {
    res.status(409);
    throw new Error("That email address is already registered.");
  }

  // The password is hashed by the pre-save hook on the model.
  const user = await User.create({ name, email, password });

  res.status(201).json({
    success: true,
    message: "Account created.",
    token: signToken(user._id),
    user: user.toPublicJSON(),
  });
}

// POST /api/auth/login
export async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error("Email and password are both required.");
  }

  // The password field is select: false on the schema, so it has to be
  // asked for explicitly here - this is the one place that needs it.
  const user = await User.findOne({ email: email.toLowerCase() }).select("+password");

  // Deliberately the same message whether the email is unknown or the
  // password is wrong. Saying which one was wrong would tell an attacker
  // which email addresses have accounts.
  if (!user || !(await user.matchesPassword(password))) {
    res.status(401);
    throw new Error("Invalid email or password.");
  }

  res.json({
    success: true,
    message: "Logged in.",
    token: signToken(user._id),
    user: user.toPublicJSON(),
  });
}

// GET /api/auth/me - protected. Shows who the token belongs to.
export async function getMe(req, res) {
  // protect() already looked the user up and put them on the request.
  res.json({ success: true, user: req.user.toPublicJSON() });
}
