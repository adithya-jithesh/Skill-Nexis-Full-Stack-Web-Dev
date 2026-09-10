import { Link, NavLink, useNavigate } from "react-router-dom";
import Avatar from "./Avatar";
import { useAuth } from "../context/AuthContext";

function Navbar() {
  const { user, isLoggedIn, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  const linkClass = ({ isActive }) => (isActive ? "is-active" : "");

  return (
    <header className="navbar">
      <Link to="/" className="navbar__brand">
        <span className="navbar__mark">TM</span>
        <span>
          <strong>Task Manager</strong>
          <small>Week 3 &middot; mini project</small>
        </span>
      </Link>

      <nav className="navbar__nav">
        {isLoggedIn ? (
          <>
            {/* NavLink knows whether its route is the current one, which is
                what draws the underline. */}
            <NavLink to="/board" className={linkClass}>
              Board
            </NavLink>
            <NavLink to="/profile" className={linkClass}>
              Profile
            </NavLink>

            <Link to="/profile" className="navbar__user">
              <Avatar user={user} size={30} />
              {user?.name}
            </Link>

            <button type="button" className="btn btn--ghost btn--small" onClick={handleLogout}>
              Log out
            </button>
          </>
        ) : (
          <>
            <NavLink to="/login" className={linkClass}>
              Log in
            </NavLink>
            <NavLink to="/register" className={linkClass}>
              Sign up
            </NavLink>
          </>
        )}
      </nav>
    </header>
  );
}

export default Navbar;
