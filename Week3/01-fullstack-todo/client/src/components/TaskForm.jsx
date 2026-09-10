import { useState } from "react";
import Field from "./Field";
import { collectErrors, validateDescription, validateTitle } from "../validation";

// Used twice: empty on the dashboard to add a task, and filled in on the
// detail page to edit one. The only difference is the task passed in, so the
// same component covers both instead of two near-identical forms.
//
// onSubmit returns an error message when the save fails and nothing when it
// works, which is what this form checks before clearing itself.
function TaskForm({ task, onSubmit, onCancel, submitLabel = "Add task" }) {
  const [form, setForm] = useState({
    title: task?.title || "",
    description: task?.description || "",
    priority: task?.priority || "medium",
    // <input type="date"> wants yyyy-mm-dd, but the API sends a full ISO
    // timestamp, so cut it down to the date part.
    dueDate: task?.dueDate ? task.dueDate.slice(0, 10) : "",
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
      description: validateDescription(form.description),
    });

    if (Object.keys(found).length > 0) {
      setErrors(found);
      return;
    }

    setBusy(true);

    const message = await onSubmit({
      title: form.title.trim(),
      description: form.description.trim(),
      priority: form.priority,
      // An empty date field means "no due date", which the schema stores as
      // null - sending "" would fail the Date cast.
      dueDate: form.dueDate || null,
    });

    setBusy(false);

    if (message) {
      setFailure(message);
      return;
    }

    // Only a new-task form empties itself. On the detail page the values
    // that were just saved are the right ones to keep showing.
    if (!task) {
      setForm({ title: "", description: "", priority: "medium", dueDate: "" });
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
          rows="3"
          value={form.description}
          onChange={handleChange}
          placeholder="Optional detail"
        />
      </Field>

      <div className="task-form__row">
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

        <Field
          label="Due date"
          name="dueDate"
          type="date"
          value={form.dueDate}
          onChange={handleChange}
        />
      </div>

      <div className="task-form__actions">
        <button type="submit" className="btn btn--primary" disabled={busy}>
          {busy ? "Saving..." : submitLabel}
        </button>

        {onCancel && (
          <button type="button" className="btn btn--ghost" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

export default TaskForm;
