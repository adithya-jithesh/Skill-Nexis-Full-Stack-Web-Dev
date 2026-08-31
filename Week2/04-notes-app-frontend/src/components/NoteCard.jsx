// NoteCard - one note. Props: note, onEdit, onTogglePin, onDelete.
// It holds no state: everything it shows comes from props, and the buttons
// call back up to App, which owns the notes.

function NoteCard({ note, onEdit, onTogglePin, onDelete }) {
  // "2026-08-31T13:50:12.574Z" reads better as "31 Aug 2026"
  const edited = new Date(note.updatedAt).toDateString().slice(4);

  return (
    <article className={note.pinned ? "note note--pinned" : "note"}>
      <div className="note__head">
        <h3>{note.title}</h3>
        {note.pinned && <span className="note__badge">Pinned</span>}
      </div>

      <p className="note__meta">Updated {edited}</p>

      {/* an empty note is normal - only show the body when there is one */}
      {note.content && <p className="note__content">{note.content}</p>}

      {note.tags.length > 0 && (
        <ul className="note__tags">
          {note.tags.map((tag) => (
            <li key={tag}>#{tag}</li>
          ))}
        </ul>
      )}

      <div className="note__actions">
        <button type="button" className="btn" onClick={() => onEdit(note)}>
          Edit
        </button>
        <button type="button" className="btn" onClick={() => onTogglePin(note._id)}>
          {note.pinned ? "Unpin" : "Pin"}
        </button>
        <button type="button" className="btn btn-danger" onClick={() => onDelete(note._id)}>
          Delete
        </button>
      </div>
    </article>
  );
}

export default NoteCard;
