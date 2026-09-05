import { useState } from "react";
import styles from "./TodoForm.module.css";

// TodoForm - the one input that adds a task.
// Props: onAdd - called with the typed text once it passes validation.

function TodoForm({ onAdd }) {
  // The input is controlled: React holds the text, the box only displays
  // it. That is what makes clearing the field after adding possible.
  const [text, setText] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(event) {
    // Without this the browser reloads the page on submit.
    event.preventDefault();

    const trimmed = text.trim();

    if (trimmed === "") {
      setError("Type something first.");
      return;
    }

    onAdd(trimmed);

    // Reset for the next task.
    setText("");
    setError("");
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.row}>
        <input
          className={styles.input}
          type="text"
          value={text}
          placeholder="What needs doing?"
          aria-label="New task"
          onChange={(event) => {
            setText(event.target.value);
            // Clear the warning as soon as they start fixing it.
            if (error) setError("");
          }}
        />
        <button className={styles.button} type="submit">
          Add
        </button>
      </div>

      {error && <p className={styles.error}>{error}</p>}
    </form>
  );
}

export default TodoForm;
