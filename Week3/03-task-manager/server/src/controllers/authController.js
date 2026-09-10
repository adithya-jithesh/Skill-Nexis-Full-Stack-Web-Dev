import fs from "node:fs/promises";
import path from "node:path";
import jwt from "jsonwebtoken";
import { UPLOAD_DIR } from "../config/paths.js";
import User from "../models/User.js";

// The payload only carries the user id - a JWT is signed, not encrypted, so
// anyone can read what is in it.
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

  const existing = await User.findOne({ email: email.toLowerCase() });

  if (existing) {
    res.status(409);
    throw new Error("That email address is already registered.");
  }

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

  const user = await User.findOne({ email: email.toLowerCase() }).select("+password");

  // The same message either way, so the login route cannot be used to find
  // out which addresses have accounts.
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

// GET /api/auth/me
export async function getMe(req, res) {
  res.json({ success: true, user: req.user.toPublicJSON() });
}

// PUT /api/auth/me - the name, and nothing else. Changing an email means
// checking it is not taken and re-issuing the token, and changing a password
// means asking for the old one first; neither belongs in this assignment.
export async function updateMe(req, res) {
  if (req.body.name !== undefined) req.user.name = req.body.name;

  await req.user.save();

  res.json({ success: true, user: req.user.toPublicJSON() });
}

// POST /api/auth/me/avatar - multipart/form-data, field "avatar".
export async function uploadAvatar(req, res) {
  if (!req.file) {
    res.status(400);
    throw new Error("No image was sent. Use a form field called 'avatar'.");
  }

  // The one the account had before, so it can be removed once the new one is
  // safely saved. Replacing an avatar ten times should not leave ten files.
  const previous = req.user.avatar;

  try {
    req.user.avatar = req.file.filename;
    await req.user.save();
  } catch (error) {
    // The new file is already on disk; drop it rather than leave it orphaned.
    await fs.unlink(path.join(UPLOAD_DIR, req.file.filename)).catch(() => {});
    throw error;
  }

  if (previous) {
    await fs.unlink(path.join(UPLOAD_DIR, previous)).catch(() => {});
  }

  res.json({ success: true, user: req.user.toPublicJSON() });
}
