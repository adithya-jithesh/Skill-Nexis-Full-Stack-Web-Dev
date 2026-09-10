import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Initials for the little circle next to the name - no image needed.
function initials(name) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
}

function Navbar() {
  const { user, isLoggedIn, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    // navigate rather than a link, because this happens after the click.
    navigate("/login");
  }

  return (
    <header className="navbar">
      <Link to="/" className="navbar__brand">
        <span className="navbar__mark">T</span>
        <span>
          <strong>Tasks</strong>
          <small>Week 3 &middot; full stack to-do</small>
        </span>
      </Link>

      <nav className="navbar__nav">
        {isLoggedIn ? (
          <>
            {/* NavLink knows whether its route is the current one, which is
                what draws the underline. */}
            <NavLink to="/tasks" className={({ isActive }) => (isActive ? "is-active" : "")}>
              My tasks
            </NavLink>
            <span className="navbar__user">
              <span className="avatar">{initials(user?.name || "?")}</span>
              {user?.name}
            </span>
            <button type="button" className="btn btn--ghost" onClick={handleLogout}>
              Log out
            </button>
          </>
        ) : (
          <>
            <NavLink to="/login" className={({ isActive }) => (isActive ? "is-active" : "")}>
              Log in
            </NavLink>
            <NavLink to="/register" className={({ isActive }) => (isActive ? "is-active" : "")}>
              Sign up
            </NavLink>
          </>
        )}
      </nav>
    </header>
  );
}

export default Navbar;
