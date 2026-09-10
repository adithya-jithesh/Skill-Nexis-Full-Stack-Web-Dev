import { Link, NavLink, useNavigate } from "react-router-dom";
import Avatar from "./Avatar";
import { useAuth } from "../context/AuthContext";
import { useRealtime } from "../context/RealtimeContext";

function Navbar() {
  const { user, isLoggedIn, logout } = useAuth();
  const { connected, online } = useRealtime();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  const linkClass = ({ isActive }) => (isActive ? "is-active" : "");

  return (
    <header className="navbar">
      <Link to="/" className="navbar__brand">
        <span className="navbar__mark" aria-hidden="true">◎</span>
        <span>
          <strong>Feed</strong>
          <small>SkillNexis Week 4 capstone</small>
        </span>
      </Link>

      <nav className="navbar__nav">
        {/* Proof the socket is up, and a use for it that needs no interaction:
            the dot goes grey the moment the connection drops. */}
        <span className={"presence" + (connected ? " presence--on" : "")} title={connected ? "Live updates on" : "Reconnecting..."}>
          <span className="presence__dot" aria-hidden="true" />
          {connected ? online + " online" : "offline"}
        </span>

        <NavLink to="/" end className={linkClass}>
          Home
        </NavLink>
        <NavLink to="/people" className={linkClass}>
          People
        </NavLink>

        {isLoggedIn ? (
          <>
            <Link to={"/u/" + user?.username} className="navbar__user">
              <Avatar user={user} size={30} linked={false} />
              <span className="navbar__username">@{user?.username}</span>
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
