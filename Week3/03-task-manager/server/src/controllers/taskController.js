import Task from "../models/Task.js";

// Every route here runs behind protect(), so req.user is always set, and
// every query filters on owner as well as id. Another user's task answers
// 404 - the same answer as one that never existed.

// Escapes the characters that mean something in a regular expression, so a
// search for "c++" or "(" is treated as plain text.
function escapeForRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Midnight this morning, used by every date filter so "today" means the
// whole day rather than the moment the request arrived.
function startOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

function addDays(date, days) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

// Turns the query string into a MongoDB filter. Kept separate because the
// list and the count both need exactly the same one.
function buildFilter(query, userId) {
  const filter = { owner: userId };

  if (query.status) filter.status = query.status.trim().toLowerCase();
  if (query.priority) filter.priority = query.priority.trim().toLowerCase();
  if (query.tag) filter.tags = query.tag.trim().toLowerCase();

  if (query.search) {
    const pattern = new RegExp(escapeForRegex(query.search), "i");
    filter.$or = [{ title: pattern }, { description: pattern }, { tags: pattern }];
  }

  // Date filters. A finished task is never overdue or due soon, so they all
  // exclude done - a list of things needing attention should not be full of
  // work that is already finished.
  const today = startOfToday();

  if (query.due === "overdue") {
    filter.dueDate = { $lt: today };
    filter.status = { $ne: "done" };
  }

  if (query.due === "today") {
    filter.dueDate = { $gte: today, $lt: addDays(today, 1) };
    filter.status = { $ne: "done" };
  }

  if (query.due === "week") {
    filter.dueDate = { $gte: today, $lt: addDays(today, 7) };
    filter.status = { $ne: "done" };
  }

  if (query.due === "none") {
    filter.dueDate = null;
  }

  return filter;
}

// Only these sorts are allowed. Passing the query string straight to sort()
// would let a client sort by anything, including fields with no index.
const SORTS = {
  created: { createdAt: -1 },
  updated: { updatedAt: -1 },
  title: { title: 1 },
  // Tasks with no due date sort last either way, since null is smallest.
  due: { dueDate: 1, createdAt: -1 },
};

// GET /api/tasks
// ?status= &priority= &tag= &search= &due=overdue|today|week|none
// &sort=created|updated|title|due &page= &limit=
export async function getTasks(req, res) {
  const filter = buildFilter(req.query, req.user._id);
  const sort = SORTS[req.query.sort] || SORTS.created;

  // Clamped, so ?limit=100000 cannot ask the server for everything at once.
  const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
  const page = Math.max(Number(req.query.page) || 1, 1);

  // The page of tasks and the total that match, at the same time - the
  // count is what tells the client whether there is another page.
  const [tasks, total] = await Promise.all([
    Task.find(filter)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit),
    Task.countDocuments(filter),
  ]);

  res.json({
    success: true,
    count: tasks.length,
    total,
    page,
    pages: Math.ceil(total / limit) || 1,
    data: tasks,
  });
}

// GET /api/tasks/stats - everything the dashboard shows, counted by MongoDB.
// The list on screen is filtered and paginated, so counting that instead
// would be wrong twice over.
export async function getStats(req, res) {
  const today = startOfToday();
  const owner = req.user._id;

  const [byStatus, overdue, dueToday] = await Promise.all([
    Task.aggregate([
      { $match: { owner } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
    Task.countDocuments({ owner, status: { $ne: "done" }, dueDate: { $lt: today } }),
    Task.countDocuments({
      owner,
      status: { $ne: "done" },
      dueDate: { $gte: today, $lt: addDays(today, 1) },
    }),
  ]);

  // The pipeline only returns the statuses that actually occur, so start
  // from zeros and fill in what came back - otherwise a board with no
  // finished tasks would have no "done" key at all.
  const counts = { todo: 0, doing: 0, done: 0 };
  for (const row of byStatus) counts[row._id] = row.count;

  res.json({
    success: true,
    data: {
      ...counts,
      total: counts.todo + counts.doing + counts.done,
      overdue,
      dueToday,
    },
  });
}

// GET /api/tasks/tags - the tags this user has used, with counts.
export async function getTags(req, res) {
  const tags = await Task.aggregate([
    { $match: { owner: req.user._id } },
    { $unwind: "$tags" },
    { $group: { _id: "$tags", count: { $sum: 1 } } },
    { $sort: { count: -1, _id: 1 } },
    { $project: { _id: 0, tag: "$_id", count: 1 } },
  ]);

  res.json({ success: true, count: tags.length, data: tags });
}

// GET /api/tasks/:id
export async function getTask(req, res) {
  const task = await Task.findOne({ _id: req.params.id, owner: req.user._id });

  if (!task) {
    res.status(404);
    throw new Error("No task found with id " + req.params.id);
  }

  res.json({ success: true, data: task });
}

// POST /api/tasks
export async function createTask(req, res) {
  const task = await Task.create({
    title: req.body.title,
    description: req.body.description,
    status: req.body.status,
    priority: req.body.priority,
    dueDate: req.body.dueDate || null,
    tags: req.body.tags,
    // From the token, never the body - otherwise a client could create
    // tasks inside someone else's account.
    owner: req.user._id,
  });

  res.status(201).json({ success: true, data: task });
}

// PUT /api/tasks/:id
export async function updateTask(req, res) {
  const updates = {};

  // Only the fields that were sent, so a small edit does not blank the rest.
  for (const field of ["title", "description", "status", "priority", "tags"]) {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  }

  // Sent as "" when a due date is being cleared, which has to become null -
  // an empty string fails the Date cast.
  if (req.body.dueDate !== undefined) updates.dueDate = req.body.dueDate || null;

  const task = await Task.findOneAndUpdate({ _id: req.params.id, owner: req.user._id }, updates, {
    new: true,
    runValidators: true,
  });

  if (!task) {
    res.status(404);
    throw new Error("No task found with id " + req.params.id);
  }

  res.json({ success: true, data: task });
}

// PATCH /api/tasks/:id/status - moving a task along its three states, which
// is the one edit the board makes constantly. A whole PUT for it would mean
// sending the entire task back just to change one word.
export async function setStatus(req, res) {
  const task = await Task.findOneAndUpdate(
    { _id: req.params.id, owner: req.user._id },
    { status: req.body.status },
    { new: true, runValidators: true }
  );

  if (!task) {
    res.status(404);
    throw new Error("No task found with id " + req.params.id);
  }

  res.json({ success: true, data: task });
}

// DELETE /api/tasks/:id
export async function deleteTask(req, res) {
  const task = await Task.findOneAndDelete({ _id: req.params.id, owner: req.user._id });

  if (!task) {
    res.status(404);
    throw new Error("No task found with id " + req.params.id);
  }

  res.json({ success: true, message: "Task deleted.", data: { id: task._id } });
}
