import { useState } from "react";
import Button from "./Button";

/**
 * Form — adds a new project card.
 *
 * Props:
 *   onAddProject   function from App. This component does NOT own the
 *                  projects list; it just hands a finished object upward.
 *
 * This is "lifting state up": the form owns its own *typing* state, but the
 * app-wide project list lives in App, because Card needs it too. A child
 * can't push data to a parent directly — the parent passes down a function,
 * and the child calls it.
 */
function Form({ onAddProject }) {
  // One state object for all three fields, instead of three useState calls.
  const [values, setValues] = useState({ title: "", description: "", tags: "" });
  const [errors, setErrors] = useState({});

  /**
   * One handler for every input — this is why each <input> has a `name`
   * matching a key in `values`.
   */
  function handleChange(event) {
    const { name, value } = event.target;

    // NEVER mutate state directly (values[name] = value won't re-render).
    // Build a NEW object with the spread operator so React sees a change.
    setValues((previous) => ({ ...previous, [name]: value }));

    // clear this field's error as soon as the user starts fixing it
    if (errors[name]) {
      setErrors((previous) => ({ ...previous, [name]: "" }));
    }
  }

  function validate() {
    const nextErrors = {};

    if (!values.title.trim()) {
      nextErrors.title = "Title is required.";
    } else if (values.title.trim().length < 3) {
      nextErrors.title = "Title must be at least 3 characters.";
    }

    if (!values.description.trim()) {
      nextErrors.description = "Description is required.";
    } else if (values.description.trim().length < 15) {
      nextErrors.description = "Description must be at least 15 characters.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function handleSubmit(event) {
    event.preventDefault(); // stop the browser reloading the page

    if (!validate()) return;

    onAddProject({
      title: values.title.trim(),
      description: values.description.trim(),
      // "react, vite, css" → ["react", "vite", "css"], empties removed
      tags: values.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    });

    // reset the form back to empty
    setValues({ title: "", description: "", tags: "" });
  }

  return (
    <form className="form" onSubmit={handleSubmit}>
      <h2 className="form__heading">Add a project</h2>

      <div className="form__field">
        <label htmlFor="title">Title</label>
        {/* CONTROLLED INPUT: `value` comes from state and `onChange` writes
            back to state. React is the single source of truth — the DOM
            never holds a value React doesn't know about. */}
        <input
          id="title"
          name="title"
          value={values.title}
          onChange={handleChange}
          placeholder="Project name"
        />
        {errors.title && <small className="form__error">{errors.title}</small>}
      </div>

      <div className="form__field">
        <label htmlFor="description">Description</label>
        <textarea
          id="description"
          name="description"
          rows="3"
          value={values.description}
          onChange={handleChange}
          placeholder="What does it do?"
        />
        {errors.description && (
          <small className="form__error">{errors.description}</small>
        )}
      </div>

      <div className="form__field">
        <label htmlFor="tags">Tags</label>
        <input
          id="tags"
          name="tags"
          value={values.tags}
          onChange={handleChange}
          placeholder="React, Vite, CSS (comma separated)"
        />
      </div>

      <Button type="submit">Add Project</Button>
    </form>
  );
}

export default Form;
