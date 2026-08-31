// Header - app name, who is logged in, and the log out button.
// Props: user, noteCount, totalCount, filtered, onLogout.

// "Adithya Jithesh" -> "AJ". Falls back to one letter for a single name.
function initials(name) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
}

function Header({ user, noteCount, totalCount, filtered, onLogout }) {
  // What the count line says depends on whether a filter is on.
  let countText = "";

  if (user) {
    if (totalCount === 0) {
      countText = "No notes yet - write your first one.";
    } else if (filtered) {
      countText = "Showing " + noteCount + " of " + totalCount + " notes";
    } else {
      countText = totalCount + (totalCount === 1 ? " note" : " notes");
    }
  }

  return (
    <header className="header">
      <div className="header__top">
        <div>
          <h1>My Notes</h1>
          <p className="header__tagline">
            SkillNexis Week 2 - a React front end for the notes API
          </p>
        </div>

        {/* only shown once someone is logged in */}
        {user && (
          <div className="header__user">
            <span className="avatar" aria-hidden="true">
              {initials(user.name)}
            </span>
            <span>
              <span className="header__name">{user.name}</span>
              <br />
              <span className="header__email">{user.email}</span>
            </span>
            <button type="button" className="btn btn-ghost" onClick={onLogout}>
              Log out
            </button>
          </div>
        )}
      </div>

      {user && <p className="header__count">{countText}</p>}
    </header>
  );
}

export default Header;
