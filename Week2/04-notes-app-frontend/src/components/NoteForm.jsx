import { useState } from "react";

// NoteForm - writes a new note, and doubles as the editor for an existing one.
// Props: editingNote (null when writing a new one), onCreate, onUpdate, onCancelEdit.
//
// There is no useEffect syncing the boxes to the note being edited. App gives
// this component a key that changes when the note does, so React throws the
// old copy away and builds a fresh one - and useState below just reads the
// right starting values. That is simpler than watching a prop and copying it
// into state afterwards, and it cannot fall out of step.

function NoteForm({ editingNote, onCreate, onUpdate, onCancelEdit }) {
  const [values, setValues] = useState({
    title: editingNote ? editingNote.title : "",
    content: editingNote ? editingNote.content : "",
    tags: editingNote ? editingNote.tags.join(", ") : "",
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

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

    setBusy(true);

    const failure = editingNote
      ? await onUpdate(editingNote._id, note)
      : await onCreate(note);

    setBusy(false);

    // The API rejected it - show why, and keep what was typed.
    if (failure) {
      setError(failure);
      return;
    }

    setValues({ title: "", content: "", tags: "" });
    setError("");
  }

  return (
    <form className="note-form" onSubmit={handleSubmit}>
      <h2>{editingNote ? "Edit note" : "New note"}</h2>

      <div className="field">
        <label htmlFor="title">Title</label>
        <input
          id="title"
          name="title"
          value={values.title}
          onChange={handleChange}
          placeholder="What is this about?"
        />
      </div>

      <div className="field">
        <label htmlFor="content">Content</label>
        <textarea
          id="content"
          name="content"
          rows="6"
          value={values.content}
          onChange={handleChange}
          placeholder="Write it down..."
        />
      </div>

      <div className="field">
        <label htmlFor="tags">Tags</label>
        <input
          id="tags"
          name="tags"
          value={values.tags}
          onChange={handleChange}
          placeholder="react, node, backend"
        />
        <p className="hint">Separate tags with commas.</p>
      </div>

      {error && <p className="error">{error}</p>}

      <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
        {busy ? "Saving..." : editingNote ? "Save changes" : "Add note"}
      </button>

      {/* only offered while editing */}
      {editingNote && (
        <button
          type="button"
          className="btn btn-block"
          style={{ marginTop: "8px" }}
          onClick={onCancelEdit}
        >
          Cancel
        </button>
      )}
    </form>
  );
}

export default NoteForm;
