import { Link } from "react-router-dom";

// The catch-all route. Without it a mistyped URL renders nothing at all.
function NotFound() {
  return (
    <div className="card card--form">
      <h1>Page not found</h1>
      <p className="muted">That address does not match any page in this app.</p>
      <Link to="/" className="btn btn--primary">
        Take me home
      </Link>
    </div>
  );
}

export default NotFound;
