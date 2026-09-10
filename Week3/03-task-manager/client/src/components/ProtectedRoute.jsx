import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// The route guard. Any <Route> nested inside this one renders through the
// <Outlet /> below, and only when there is a session.
//
// This is convenience, not security: anyone can edit their own browser. The
// real protection is protect() on the server, which is why the API still
// checks the token on every single request.
function ProtectedRoute() {
  const { isLoggedIn, checking } = useAuth();
  const location = useLocation();

  // On a refresh the saved token is still being checked. Redirecting now
  // would throw a logged-in user out on every reload.
  if (checking) {
    return <p className="loading">Checking your session...</p>;
  }

  if (!isLoggedIn) {
    // state.from remembers where they were headed, so logging in can send
    // them back there instead of always to the dashboard.
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}

export default ProtectedRoute;
