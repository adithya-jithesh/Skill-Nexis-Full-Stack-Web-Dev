import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// The route guard. Any <Route> nested inside renders through the <Outlet />
// below, and only when there is a session.
//
// Convenience, not security: anyone can edit their own browser. What actually
// protects anything is protect() on the server, which is why every write still
// checks the token.
function ProtectedRoute() {
  const { isLoggedIn, checking } = useAuth();
  const location = useLocation();

  // On a refresh the saved token is still being checked. Redirecting now would
  // throw a logged-in user out on every reload.
  if (checking) return <p className="loading">Checking your session...</p>;

  if (!isLoggedIn) {
    // Remember where they were headed, so logging in can continue there.
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}

export default ProtectedRoute;
