import Task from "../models/Task.js";

// Every route in this file runs behind protect(), so req.user is always set,
// and every query filters on owner as well as id. Asking for someone else's
// task returns 404 - the same answer as a task that was never there.

// GET /api/tasks
// Optional: ?completed=true  ?priority=high  ?search=text
export async function getTasks(req, res) {
  const filter = { owner: req.user._id };

  if (req.query.completed === "true") filter.completed = true;
  if (req.query.completed === "false") filter.completed = false;

  if (req.query.priority) filter.priority = req.query.priority.trim().toLowerCase();

  if (req.query.search) {
    // Escape the characters that mean something in a regular expression, so
    // a search for "c++" or "(" is treated as plain text.
    const safe = req.query.search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const pattern = new RegExp(safe, "i"); // i = case insensitive
    filter.$or = [{ title: pattern }, { description: pattern }];
  }

  // Unfinished tasks first, then newest.
  const tasks = await Task.find(filter).sort({ completed: 1, createdAt: -1 });

  res.json({ success: true, count: tasks.length, data: tasks });
}

// GET /api/tasks/stats - the counts the dashboard shows, worked out by
// MongoDB rather than by fetching every task and counting in the browser.
export async function getStats(req, res) {
  const [stats] = await Task.aggregate([
    { $match: { owner: req.user._id } },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        completed: { $sum: { $cond: ["$completed", 1, 0] } },
        high: { $sum: { $cond: [{ $eq: ["$priority", "high"] }, 1, 0] } },
      },
    },
    { $project: { _id: 0, total: 1, completed: 1, high: 1 } },
  ]);

  // An account with no tasks matches nothing, so the pipeline comes back empty.
  const data = stats || { total: 0, completed: 0, high: 0 };

  res.json({ success: true, data: { ...data, active: data.total - data.completed } });
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
    completed: req.body.completed,
    priority: req.body.priority,
    dueDate: req.body.dueDate || null,
    // Taken from the token, never from the body - otherwise a client could
    // create tasks inside someone else's account.
    owner: req.user._id,
  });

  res.status(201).json({ success: true, data: task });
}

// PUT /api/tasks/:id
export async function updateTask(req, res) {
  const updates = {};

  // Only the fields that were sent, so a small update does not blank the rest.
  for (const field of ["title", "description", "completed", "priority", "dueDate"]) {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  }

  const task = await Task.findOneAndUpdate({ _id: req.params.id, owner: req.user._id }, updates, {
    new: true, // return the task as it is after the update, not before
    runValidators: true, // schema rules apply to updates too, not just creates
  });

  if (!task) {
    res.status(404);
    throw new Error("No task found with id " + req.params.id);
  }

  res.json({ success: true, data: task });
}

// PATCH /api/tasks/:id/toggle - flips completed without sending a body.
export async function toggleTask(req, res) {
  const task = await Task.findOne({ _id: req.params.id, owner: req.user._id });

  if (!task) {
    res.status(404);
    throw new Error("No task found with id " + req.params.id);
  }

  task.completed = !task.completed;
  await task.save();

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
