import { useEffect, useState } from "react";

// NoteForm - writes a new note, and doubles as the editor for an existing one.
// Props: editingNote (null when writing a new one), onCreate, onUpdate, onCancelEdit.

const empty = { title: "", content: "", tags: "" };

function NoteForm({ editingNote, onCreate, onUpdate, onCancelEdit }) {
  const [values, setValues] = useState(empty);
  const [error, setError] = useState("");

  // When App hands over a note to edit, load it into the boxes. This is a
  // genuine use for useEffect: the form state has to follow a prop that
  // changed somewhere else.
  useEffect(() => {
    if (editingNote) {
      setValues({
        title: editingNote.title,
        content: editingNote.content,
        tags: editingNote.tags.join(", "),
      });
    } else {
      setValues(empty);
    }
    setError("");
  }, [editingNote]);

  function handleChange(event) {
    setValues({ ...values, [event.target.name]: event.target.value });
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (values.title.trim().length < 2) {
      setError("A note needs a title of at least 2 characters.");
      return;
    }

    // "react, node" in the box becomes ["react", "node"] for the API.
    // The backend lowercases them, so casing here does not matter.
    const note = {
      title: values.title,
      content: values.content,
      tags: values.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    };

    const failure = editingNote
      ? await onUpdate(editingNote._id, note)
      : await onCreate(note);

    // The API rejected it - show why and keep what was typed.
    if (failure) {
      setError(failure);
      return;
    }

    setValues(empty);
    setError("");
  }

  return (
    <form className="note-form" onSubmit={handleSubmit}>
      <h2>{editingNote ? "Edit note" : "New note"}</h2>

      <label htmlFor="title">Title</label>
      <input id="title" name="title" value={values.title} onChange={handleChange} />

      <label htmlFor="content">Content</label>
      <textarea
        id="content"
        name="content"
        rows="6"
        value={values.content}
        onChange={handleChange}
      />

      <label htmlFor="tags">Tags</label>
      <input
        id="tags"
        name="tags"
        value={values.tags}
        onChange={handleChange}
        placeholder="react, node, backend"
      />
      <p className="hint">Separate tags with commas.</p>

      {error && <p className="error">{error}</p>}

      <button type="submit" className="btn btn-primary">
        {editingNote ? "Save changes" : "Add note"}
      </button>

      {/* only offered while editing */}
      {editingNote && (
        <button type="button" className="btn" onClick={onCancelEdit}>
          Cancel
        </button>
      )}
    </form>
  );
}

export default NoteForm;
