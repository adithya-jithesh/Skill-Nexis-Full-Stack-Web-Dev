import Note from "../models/Note.js";

// Every route in this file runs behind protect(), so req.user is always set.
//
// The important rule: each query is filtered by owner as well as id. Asking
// for someone else's note by its id returns 404, exactly as a note that does
// not exist would - a user cannot even tell whether another user's note is
// there. Without the owner filter, anyone holding an id could read anyone's
// notes.

// Escapes the characters that mean something special in a regular
// expression, so a search for "c++" or "(" is treated as plain text.
function escapeForRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// GET /api/notes
// Optional: ?search=text  ?tag=react  ?pinned=true
export async function getNotes(req, res) {
  const filter = { owner: req.user._id };

  if (req.query.tag) {
    filter.tags = req.query.tag.trim().toLowerCase();
  }

  if (req.query.pinned === "true") filter.pinned = true;
  if (req.query.pinned === "false") filter.pinned = false;

  if (req.query.search) {
    const pattern = new RegExp(escapeForRegex(req.query.search), "i"); // i = case insensitive
    filter.$or = [{ title: pattern }, { content: pattern }, { tags: pattern }];
  }

  // Pinned notes first, then most recently updated within each group.
  const notes = await Note.find(filter).sort({ pinned: -1, updatedAt: -1 });

  res.json({ success: true, count: notes.length, data: notes });
}

// GET /api/notes/:id
export async function getNote(req, res) {
  const note = await Note.findOne({ _id: req.params.id, owner: req.user._id });

  if (!note) {
    res.status(404);
    throw new Error("No note found with id " + req.params.id);
  }

  res.json({ success: true, data: note });
}

// POST /api/notes
export async function createNote(req, res) {
  const note = await Note.create({
    title: req.body.title,
    content: req.body.content,
    tags: req.body.tags,
    pinned: req.body.pinned,
    // Taken from the token, never from the body - otherwise a client could
    // create notes inside someone else's account.
    owner: req.user._id,
  });

  res.status(201).json({ success: true, data: note });
}

// PUT /api/notes/:id
export async function updateNote(req, res) {
  const updates = {};

  // Only the fields that were sent, so a small update does not blank the rest.
  if (req.body.title !== undefined) updates.title = req.body.title;
  if (req.body.content !== undefined) updates.content = req.body.content;
  if (req.body.tags !== undefined) updates.tags = req.body.tags;
  if (req.body.pinned !== undefined) updates.pinned = req.body.pinned;

  const note = await Note.findOneAndUpdate(
    { _id: req.params.id, owner: req.user._id },
    updates,
    { new: true, runValidators: true }
  );

  if (!note) {
    res.status(404);
    throw new Error("No note found with id " + req.params.id);
  }

  res.json({ success: true, data: note });
}

// PATCH /api/notes/:id/pin - flips pinned without sending a body.
export async function togglePin(req, res) {
  const note = await Note.findOne({ _id: req.params.id, owner: req.user._id });

  if (!note) {
    res.status(404);
    throw new Error("No note found with id " + req.params.id);
  }

  note.pinned = !note.pinned;
  await note.save();

  res.json({ success: true, data: note });
}

// DELETE /api/notes/:id
export async function deleteNote(req, res) {
  const note = await Note.findOneAndDelete({ _id: req.params.id, owner: req.user._id });

  if (!note) {
    res.status(404);
    throw new Error("No note found with id " + req.params.id);
  }

  res.json({ success: true, message: "Note deleted.", data: { id: note._id } });
}

// GET /api/notes/tags - the tags this user has actually used, with counts.
// Handy for building a sidebar in a front end.
export async function getTags(req, res) {
  // An aggregation pipeline: take this user's notes, unwind the tag arrays
  // into one row per tag, count them, then sort by how often they are used.
  const tags = await Note.aggregate([
    { $match: { owner: req.user._id } },
    { $unwind: "$tags" },
    { $group: { _id: "$tags", count: { $sum: 1 } } },
    { $sort: { count: -1, _id: 1 } },
    { $project: { _id: 0, tag: "$_id", count: 1 } },
  ]);

  res.json({ success: true, count: tags.length, data: tags });
}
