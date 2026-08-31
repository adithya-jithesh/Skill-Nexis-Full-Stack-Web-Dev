import { useCallback, useEffect, useState } from "react";
import { api } from "./api";
import AuthForm from "./components/AuthForm";
import Footer from "./components/Footer";
import Header from "./components/Header";
import NoteCard from "./components/NoteCard";
import NoteForm from "./components/NoteForm";
import Sidebar from "./components/Sidebar";

const footerLinks = [
  { label: "GitHub", href: "https://github.com/adithya-jithesh" },
  { label: "LinkedIn", href: "https://linkedin.com/in/adithyajithesh" },
];

// The token is kept in localStorage so a page refresh does not log you out.
// It is read once, when the app first loads.
const savedToken = localStorage.getItem("notes_token") || "";
const savedUser = JSON.parse(localStorage.getItem("notes_user") || "null");

function App() {
  const [token, setToken] = useState(savedToken);
  const [user, setUser] = useState(savedUser);
  const [authError, setAuthError] = useState("");

  const [notes, setNotes] = useState([]);
  // The unfiltered total, so the header can say "showing 2 of 7".
  const [totalCount, setTotalCount] = useState(0);
  const [tags, setTags] = useState([]);
  const [search, setSearch] = useState("");
  const [activeTag, setActiveTag] = useState("");
  const [editingNote, setEditingNote] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // Logs out and wipes everything belonging to the old session.
  const logout = useCallback(() => {
    localStorage.removeItem("notes_token");
    localStorage.removeItem("notes_user");
    setToken("");
    setUser(null);
    setNotes([]);
    setTotalCount(0);
    setTags([]);
    setEditingNote(null);
    setSearch("");
    setActiveTag("");
  }, []);

  // Fetches the notes and the tag counts for the current filters.
  const loadNotes = useCallback(async () => {
    if (!token) return;

    setLoading(true);
    setMessage("");

    try {
      const filtering = Boolean(search || activeTag);

      // Both at once rather than one after the other, since neither needs
      // the other's answer.
      const [noteResult, tagResult] = await Promise.all([
        api.getNotes(token, { search, tag: activeTag }),
        api.getTags(token),
      ]);

      setNotes(noteResult.data);
      setTags(tagResult.data);

      // The header wants the unfiltered total for "showing 2 of 7". When
      // nothing is filtered the list just fetched is already that total, so
      // only ask again when a filter is actually on.
      if (filtering) {
        const allResult = await api.getNotes(token);
        setTotalCount(allResult.count);
      } else {
        setTotalCount(noteResult.count);
      }
    } catch (error) {
      // 401 means the token has expired or is no longer accepted, so the
      // only sensible thing is to send the user back to the login screen.
      if (error.status === 401) {
        logout();
        setAuthError("Your session has expired. Please log in again.");
      } else {
        setMessage(error.message);
      }
    } finally {
      setLoading(false);
    }
  }, [token, search, activeTag, logout]);

  // Runs on login and again whenever the search or tag filter changes.
  // Filtering happens on the server, so this asks the API for the matching
  // notes rather than filtering a local copy.
  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  function saveSession(result) {
    localStorage.setItem("notes_token", result.token);
    localStorage.setItem("notes_user", JSON.stringify(result.user));
    setToken(result.token);
    setUser(result.user);
    setAuthError("");
  }

  async function handleLogin(email, password) {
    try {
      saveSession(await api.login(email, password));
    } catch (error) {
      setAuthError(error.message);
    }
  }

  async function handleRegister(name, email, password) {
    try {
      saveSession(await api.register(name, email, password));
    } catch (error) {
      setAuthError(error.message);
    }
  }

  // These three return an error message on failure and nothing on success,
  // which is what NoteForm checks to decide whether to clear itself.
  async function handleCreate(note) {
    try {
      await api.createNote(token, note);
      await loadNotes();
      setMessage("Note added.");
    } catch (error) {
      return error.message;
    }
  }

  async function handleUpdate(id, updates) {
    try {
      await api.updateNote(token, id, updates);
      setEditingNote(null);
      await loadNotes();
      setMessage("Note updated.");
    } catch (error) {
      return error.message;
    }
  }

  async function handleTogglePin(id) {
    try {
      await api.togglePin(token, id);
      await loadNotes();
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function handleDelete(id) {
    try {
      await api.deleteNote(token, id);
      // If the note being edited is the one just deleted, close the editor.
      if (editingNote && editingNote._id === id) setEditingNote(null);
      await loadNotes();
      setMessage("Note deleted.");
    } catch (error) {
      setMessage(error.message);
    }
  }

  function handleClearFilters() {
    setSearch("");
    setActiveTag("");
  }

  // Nobody logged in: the notes are not rendered at all. The real protection
  // is on the server - this only decides what to show.
  if (!token) {
    return (
      <div className="app">
        <Header user={null} noteCount={0} totalCount={0} filtered={false} onLogout={logout} />
        <AuthForm onLogin={handleLogin} onRegister={handleRegister} error={authError} />
        <Footer name="Adithya Jithesh" links={footerLinks} />
      </div>
    );
  }

  return (
    <div className="app">
      <Header
        user={user}
        noteCount={notes.length}
        totalCount={totalCount}
        filtered={Boolean(search || activeTag)}
        onLogout={logout}
      />

      {message && (
        <p className="banner">
          {message}
          <button
            type="button"
            className="banner__close"
            aria-label="Dismiss"
            onClick={() => setMessage("")}
          >
            &times;
          </button>
        </p>
      )}

      {/* two columns: writing and filtering on the left, the notes on the right */}
      <div className="layout">
        <div className="left-column">
          {/* The key is what resets the form. When a different note is
              picked for editing (or editing is cancelled) the key changes,
              React discards the old form and mounts a fresh one already
              holding that note's values - no effect needed. */}
          <NoteForm
            key={editingNote ? editingNote._id : "new"}
            editingNote={editingNote}
            onCreate={handleCreate}
            onUpdate={handleUpdate}
            onCancelEdit={() => setEditingNote(null)}
          />

          <Sidebar
            search={search}
            onSearchChange={setSearch}
            tags={tags}
            activeTag={activeTag}
            onTagChange={setActiveTag}
            onClearFilters={handleClearFilters}
          />
        </div>

        <div className="right-column">
          {/* Grey placeholder cards while the request is in flight, so the
              layout does not jump once the notes arrive. */}
          {loading && (
            <div className="note-grid">
              <div className="skeleton" />
              <div className="skeleton" />
            </div>
          )}

          {!loading && notes.length === 0 && (
            <div className="empty">
              <p className="empty__title">
                {search || activeTag ? "Nothing matches that" : "No notes yet"}
              </p>
              <p>
                {search || activeTag
                  ? "Try a different search, or clear the filters on the left."
                  : "Write your first note using the form on the left."}
              </p>
            </div>
          )}

          {!loading && notes.length > 0 && (
            <div className="note-grid">
              {notes.map((note) => (
                <NoteCard
                  key={note._id}
                  note={note}
                  onEdit={setEditingNote}
                  onTogglePin={handleTogglePin}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <Footer name="Adithya Jithesh" links={footerLinks} />
    </div>
  );
}

export default App;
