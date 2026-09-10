import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import { useAuth } from "./context/AuthContext";
import Board from "./pages/Board";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import Profile from "./pages/Profile";
import Register from "./pages/Register";
import TaskDetail from "./pages/TaskDetail";

// Where an already-logged-in visitor to /login or /register should go.
//
// It has to honour the same state.from the guard set, not just the default.
// Logging in flips isLoggedIn, which re-renders this route before Login's own
// navigate() runs - so without this, that redirect would win the race and
// everyone would land on /board, however they arrived.
function AlreadyLoggedIn({ fallback }) {
  const location = useLocation();

  return <Navigate to={location.state?.from || fallback} replace />;
}

function App() {
  const { isLoggedIn } = useAuth();

  return (
    <div className="app">
      <Navbar />

      <main className="main">
        <Routes>
          <Route path="/" element={<Navigate to={isLoggedIn ? "/board" : "/login"} replace />} />

          {/* Already logged in? The auth pages are pointless, so bounce -
              to wherever the guard was sending them, if it was. */}
          <Route
            path="/login"
            element={isLoggedIn ? <AlreadyLoggedIn fallback="/board" /> : <Login />}
          />
          <Route
            path="/register"
            element={isLoggedIn ? <AlreadyLoggedIn fallback="/board" /> : <Register />}
          />

          {/* Everything nested here needs a session. */}
          <Route element={<ProtectedRoute />}>
            <Route path="/board" element={<Board />} />
            <Route path="/board/:id" element={<TaskDetail />} />
            <Route path="/profile" element={<Profile />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      <footer className="footer">
        <span>Adithya Jithesh &middot; SkillNexis Week 3 mini project</span>
        <span className="footer__links">
          <a href="https://github.com/adithya-jithesh">GitHub</a>
          <a href="https://linkedin.com/in/adithyajithesh">LinkedIn</a>
        </span>
      </footer>
    </div>
  );
}

export default App;
