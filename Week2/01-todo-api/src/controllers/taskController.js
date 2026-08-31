import Task from "../models/Task.js";

// One function per endpoint. Each one talks to the model and sends JSON;
// the routing lives in routes/taskRoutes.js so this file stays readable.

// GET /api/tasks
// Supports ?completed=true and ?priority=high as optional filters.
export async function getTasks(req, res) {
  const filter = {};

  if (req.query.completed === "true") filter.completed = true;
  if (req.query.completed === "false") filter.completed = false;
  if (req.query.priority) filter.priority = req.query.priority;

  // newest first
  const tasks = await Task.find(filter).sort({ createdAt: -1 });

  res.json({ success: true, count: tasks.length, data: tasks });
}

// GET /api/tasks/:id
export async function getTask(req, res) {
  const task = await Task.findById(req.params.id);

  if (!task) {
    res.status(404);
    throw new Error("No task found with id " + req.params.id);
  }

  res.json({ success: true, data: task });
}

// POST /api/tasks
export async function createTask(req, res) {
  // Only these fields are read from the body. Copying req.body straight in
  // would let anyone set fields the client has no business setting.
  const task = await Task.create({
    title: req.body.title,
    description: req.body.description,
    priority: req.body.priority,
    dueDate: req.body.dueDate,
  });

  // 201 means "created", and is the correct status for a successful POST.
  res.status(201).json({ success: true, data: task });
}

// PUT /api/tasks/:id
export async function updateTask(req, res) {
  const updates = {};

  // Only copy the fields that were actually sent, so a PUT with just
  // { "completed": true } does not wipe the title.
  if (req.body.title !== undefined) updates.title = req.body.title;
  if (req.body.description !== undefined) updates.description = req.body.description;
  if (req.body.completed !== undefined) updates.completed = req.body.completed;
  if (req.body.priority !== undefined) updates.priority = req.body.priority;
  if (req.body.dueDate !== undefined) updates.dueDate = req.body.dueDate;

  const task = await Task.findByIdAndUpdate(req.params.id, updates, {
    new: true, // return the updated document, not the old one
    runValidators: true, // apply the schema rules to the update too
  });

  if (!task) {
    res.status(404);
    throw new Error("No task found with id " + req.params.id);
  }

  res.json({ success: true, data: task });
}

// PATCH /api/tasks/:id/toggle - flips completed without sending a body.
export async function toggleTask(req, res) {
  const task = await Task.findById(req.params.id);

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
  const task = await Task.findByIdAndDelete(req.params.id);

  if (!task) {
    res.status(404);
    throw new Error("No task found with id " + req.params.id);
  }

  res.json({ success: true, message: "Task deleted.", data: { id: task._id } });
}
