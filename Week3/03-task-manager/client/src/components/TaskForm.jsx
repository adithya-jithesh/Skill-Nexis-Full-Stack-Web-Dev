import { useState } from "react";
import Field from "./Field";
import { collectErrors, validateDescription, validateTitle } from "../validation";

// Used twice: empty on the board to add a task, and filled in on the detail
// page to edit one. The only difference is the task passed in.
//
// onSubmit returns an error message when the save fails and nothing when it
// works, which is what this form checks before clearing itself.
function TaskForm({ task, onSubmit, submitLabel = "Add task", compact = false }) {
  const [form, setForm] = useState({
    title: task?.title || "",
    description: task?.description || "",
    status: task?.status || "todo",
    priority: task?.priority || "medium",
    // <input type="date"> wants yyyy-mm-dd; the API sends a full ISO
    // timestamp, so cut it down.
    dueDate: task?.dueDate ? task.dueDate.slice(0, 10) : "",
    tags: (task?.tags || []).join(", "),
  });
  const [errors, setErrors] = useState({});
  const [failure, setFailure] = useState("");
  const [busy, setBusy] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: "" }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFailure("");

    const found = collectErrors({
      title: validateTitle(form.title),
      description: validateDescription(form.description, 1000),
    });

    if (Object.keys(found).length > 0) {
      setErrors(found);
      return;
    }

    setBusy(true);

    const message = await onSubmit({
      title: form.title.trim(),
      description: form.description.trim(),
      status: form.status,
      priority: form.priority,
      // "" rather than undefined, so clearing the field clears the date -
      // the server turns an empty string into null.
      dueDate: form.dueDate,
      // The schema lowercases and trims these; splitting on commas is all
      // the client has to do.
      tags: form.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    });

    setBusy(false);

    if (message) {
      setFailure(message);
      return;
    }

    // Only a new-task form empties itself. When editing, the values just
    // saved are the right ones to keep showing.
    if (!task) {
      setForm({ title: "", description: "", status: "todo", priority: "medium", dueDate: "", tags: "" });
    }
  }

  return (
    <form className="task-form" onSubmit={handleSubmit} noValidate>
      {failure && <p className="alert alert--error">{failure}</p>}

      <Field
        label="Title"
        name="title"
        value={form.title}
        onChange={handleChange}
        error={errors.title}
        placeholder="What needs doing?"
      />

      <Field label="Description" name="description" error={errors.description}>
        <textarea
          id="description"
          name="description"
          className="field__input"
          rows={compact ? 2 : 4}
          value={form.description}
          onChange={handleChange}
          placeholder="Optional detail"
        />
      </Field>

      <div className="form-row">
        <Field label="Status" name="status">
          <select
            id="status"
            name="status"
            className="field__input"
            value={form.status}
            onChange={handleChange}
          >
            <option value="todo">To do</option>
            <option value="doing">Doing</option>
            <option value="done">Done</option>
          </select>
        </Field>

        <Field label="Priority" name="priority">
          <select
            id="priority"
            name="priority"
            className="field__input"
            value={form.priority}
            onChange={handleChange}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </Field>
      </div>

      <div className="form-row">
        <Field
          label="Due date"
          name="dueDate"
          type="date"
          value={form.dueDate}
          onChange={handleChange}
        />

        <Field
          label="Tags"
          name="tags"
          value={form.tags}
          onChange={handleChange}
          placeholder="work, urgent"
          hint="Separated by commas."
        />
      </div>

      <button type="submit" className="btn btn--primary btn--block" disabled={busy}>
        {busy ? "Saving..." : submitLabel}
      </button>
    </form>
  );
}

export default TaskForm;
