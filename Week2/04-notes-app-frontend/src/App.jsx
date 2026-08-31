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
      const [noteResult, tagResult] = await Promise.all([
        api.getNotes(token, { search, tag: activeTag }),
        api.getTags(token),
      ]);

      setNotes(noteResult.data);
      setTags(tagResult.data);
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
        <Header user={null} noteCount={0} onLogout={logout} />
        <AuthForm onLogin={handleLogin} onRegister={handleRegister} error={authError} />
        <Footer name="Adithya Jithesh" links={footerLinks} />
      </div>
    );
  }

  return (
    <div className="app">
      <Header user={user} noteCount={notes.length} onLogout={logout} />

      {message && <p className="banner">{message}</p>}

      {/* two columns: writing and filtering on the left, the notes on the right */}
      <div className="layout">
        <div className="left-column">
          <NoteForm
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
          {loading && <p className="hint">Loading...</p>}

          {!loading && notes.length === 0 && (
            <p className="no-results">
              {search || activeTag
                ? "No notes match that. Try clearing the filters."
                : "Nothing here yet. Write your first note on the left."}
            </p>
          )}

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
      </div>

      <Footer name="Adithya Jithesh" links={footerLinks} />
    </div>
  );
}

export default App;
