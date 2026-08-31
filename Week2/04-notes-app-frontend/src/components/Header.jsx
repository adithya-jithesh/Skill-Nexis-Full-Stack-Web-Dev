// Header - app name, who is logged in, and the log out button.
// Props: user, noteCount, onLogout.

function Header({ user, noteCount, onLogout }) {
  return (
    <header className="header">
      <div className="header__top">
        <div>
          <h1>My Notes</h1>
          <p>SkillNexis Week 2 - a React front end for the notes API</p>
        </div>

        {/* only shown once someone is logged in */}
        {user && (
          <div className="header__user">
            <span>{user.name}</span>
            <button type="button" className="btn btn-ghost" onClick={onLogout}>
              Log out
            </button>
          </div>
        )}
      </div>

      {user && (
        <p className="header__count">
          {noteCount === 0
            ? "No notes yet - write your first one."
            : "Showing " + noteCount + (noteCount === 1 ? " note" : " notes")}
        </p>
      )}
    </header>
  );
}

export default Header;
