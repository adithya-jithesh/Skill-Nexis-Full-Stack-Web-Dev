import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import { useAuth } from "./context/AuthContext";
import Home from "./pages/Home";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import People from "./pages/People";
import PostPage from "./pages/PostPage";
import Profile from "./pages/Profile";
import Register from "./pages/Register";
import Settings from "./pages/Settings";

// Where an already-logged-in visitor to /login or /register should go.
//
// It honours the state.from the guard set rather than always going home:
// logging in flips isLoggedIn, which re-renders this route before the login
// page's own navigate() runs, so without this that redirect wins the race.
function AlreadyLoggedIn() {
  const location = useLocation();

  return <Navigate to={location.state?.from || "/"} replace />;
}

function App() {
  const { isLoggedIn } = useAuth();

  return (
    <div className="app">
      <Navbar />

      <main className="main">
        <Routes>
          {/* Public: the feed, profiles and threads all read logged out. */}
          <Route path="/" element={<Home />} />
          <Route path="/people" element={<People />} />
          <Route path="/u/:username" element={<Profile />} />
          <Route path="/p/:id" element={<PostPage />} />

          <Route path="/login" element={isLoggedIn ? <AlreadyLoggedIn /> : <Login />} />
          <Route path="/register" element={isLoggedIn ? <AlreadyLoggedIn /> : <Register />} />

          {/* Your own settings are the one page that needs a session. */}
          <Route element={<ProtectedRoute />}>
            <Route path="/settings" element={<Settings />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      <footer className="footer">
        <span>Adithya Jithesh &middot; SkillNexis Week 4 capstone</span>
        <span className="footer__links">
          <a href="https://github.com/adithya-jithesh">GitHub</a>
          <a href="https://linkedin.com/in/adithyajithesh">LinkedIn</a>
        </span>
      </footer>
    </div>
  );
}

export default App;
