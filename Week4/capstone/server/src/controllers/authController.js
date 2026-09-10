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
  const { name, username, email, password } = req.body;

  if (!name || !username || !email || !password) {
    res.status(400);
    throw new Error("Name, username, email and password are all required.");
  }

  // Checked here so the client gets a message naming which one is taken. The
  // unique indexes still back it up, in case two registrations race.
  const clash = await User.findOne({
    $or: [{ email: email.toLowerCase() }, { username: username.toLowerCase() }],
  });

  if (clash) {
    res.status(409);
    throw new Error(
      clash.email === email.toLowerCase()
        ? "That email address is already registered."
        : "That username is already taken."
    );
  }

  const user = await User.create({ name, username, email, password });

  res.status(201).json({
    success: true,
    message: "Welcome aboard.",
    token: signToken(user._id),
    user: user.toPrivateJSON(),
  });
}

// POST /api/auth/login - by email or username, since people remember one or
// the other and the site shows usernames everywhere.
export async function login(req, res) {
  const { identifier, password } = req.body;

  if (!identifier || !password) {
    res.status(400);
    throw new Error("Email or username, and password, are both required.");
  }

  const handle = identifier.trim().toLowerCase();

  // The password field is select: false, so it has to be asked for by name.
  const user = await User.findOne({
    $or: [{ email: handle }, { username: handle }],
  }).select("+password");

  // The same message either way, so the login route cannot be used to work
  // out which addresses or usernames have accounts.
  if (!user || !(await user.matchesPassword(password))) {
    res.status(401);
    throw new Error("Invalid credentials.");
  }

  res.json({
    success: true,
    message: "Logged in.",
    token: signToken(user._id),
    user: user.toPrivateJSON(),
  });
}

// GET /api/auth/me
export async function getMe(req, res) {
  res.json({ success: true, user: req.user.toPrivateJSON() });
}

// PUT /api/auth/me - display name and bio. Changing an email means checking
// it is not taken and re-issuing the token, and changing a password means
// asking for the old one first; neither belongs in this project.
export async function updateMe(req, res) {
  if (req.body.name !== undefined) req.user.name = req.body.name;
  if (req.body.bio !== undefined) req.user.bio = req.body.bio;

  await req.user.save();

  res.json({ success: true, user: req.user.toPrivateJSON() });
}

// POST /api/auth/me/avatar - multipart/form-data, field "avatar".
export async function uploadAvatar(req, res) {
  if (!req.file) {
    res.status(400);
    throw new Error("No image was sent. Use a form field called 'avatar'.");
  }

  // The one the account had before, removed once the new one is safely saved
  // - changing an avatar ten times should not leave ten files behind.
  const previous = req.user.avatar;

  try {
    req.user.avatar = req.file.filename;
    await req.user.save();
  } catch (error) {
    // The new file is already on disk; drop it rather than orphan it.
    await fs.unlink(path.join(UPLOAD_DIR, req.file.filename)).catch(() => {});
    throw error;
  }

  if (previous) await fs.unlink(path.join(UPLOAD_DIR, previous)).catch(() => {});

  res.json({ success: true, user: req.user.toPrivateJSON() });
}
