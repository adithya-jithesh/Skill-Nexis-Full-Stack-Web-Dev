import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { RealtimeProvider } from "./context/RealtimeContext.jsx";
import "./index.css";

// BrowserRouter has to sit outside anything that routes, and AuthProvider
// outside anything that reads the session - which includes the route guard.
// RealtimeProvider goes inside AuthProvider, because the socket hands over the
// token during its handshake and has to reconnect when that token changes.
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <RealtimeProvider>
          <App />
        </RealtimeProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);
