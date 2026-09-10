import { Link } from "react-router-dom";

// The catch-all route. Without it a mistyped URL renders nothing at all.
function NotFound() {
  return (
    <div className="card card--form">
      <h1>Page not found</h1>
      <p className="muted">That address does not match any page here.</p>
      <Link to="/" className="btn btn--primary">
        Back to the feed
      </Link>
    </div>
  );
}

export default NotFound;
