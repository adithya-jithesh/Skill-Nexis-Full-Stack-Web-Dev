import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import Register from "./pages/Register";
import TaskDetail from "./pages/TaskDetail";
import { useAuth } from "./context/AuthContext";

// Where an already-logged-in visitor to /login or /register should go.
//
// It has to honour the same state.from the guard set, not just the default.
// Logging in flips isLoggedIn, which re-renders this route before Login's own
// navigate() runs - so without this, that redirect would win the race and
// everyone would land on /tasks, however they arrived.
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
          {/* "/" goes wherever makes sense for the current session. */}
          <Route path="/" element={<Navigate to={isLoggedIn ? "/tasks" : "/login"} replace />} />

          {/* Already logged in? The login and register pages are pointless,
              so bounce - to wherever the guard was sending them, if it was. */}
          <Route
            path="/login"
            element={isLoggedIn ? <AlreadyLoggedIn fallback="/tasks" /> : <Login />}
          />
          <Route
            path="/register"
            element={isLoggedIn ? <AlreadyLoggedIn fallback="/tasks" /> : <Register />}
          />

          {/* Everything inside this element needs a session. ProtectedRoute
              renders its nested routes only when there is one. */}
          <Route element={<ProtectedRoute />}>
            <Route path="/tasks" element={<Dashboard />} />
            <Route path="/tasks/:id" element={<TaskDetail />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      <footer className="footer">
        <span>Adithya Jithesh &middot; SkillNexis Week 3</span>
        <span className="footer__links">
          <a href="https://github.com/adithya-jithesh">GitHub</a>
          <a href="https://linkedin.com/in/adithyajithesh">LinkedIn</a>
        </span>
      </footer>
    </div>
  );
}

export default App;
