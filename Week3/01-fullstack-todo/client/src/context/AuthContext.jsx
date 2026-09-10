import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api, setUnauthorisedHandler, TOKEN_KEY } from "../api";

// Who is logged in is needed by the navbar, the route guard and both auth
// pages. Passing it down as props would mean threading it through every
// component in between, so it lives in a context instead - this is the
// "Context API for state management" part of the week.
const AuthContext = createContext(null);

const USER_KEY = "todo_user";

export function AuthProvider({ children }) {
  // Read straight out of localStorage on the first render, so a refresh does
  // not flash the login screen before the session is restored.
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || "");
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem(USER_KEY) || "null"));
  // True until the saved token has been checked against the server.
  const [checking, setChecking] = useState(Boolean(localStorage.getItem(TOKEN_KEY)));

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken("");
    setUser(null);
  }, []);

  // A 401 from any request anywhere ends the session. Registered once.
  useEffect(() => {
    setUnauthorisedHandler(logout);
  }, [logout]);

  // A token in localStorage only means one was saved at some point - it can
  // still be expired, or belong to a deleted account. /me is the cheapest
  // way to ask the server whether it is still good.
  useEffect(() => {
    if (!token) {
      setChecking(false);
      return;
    }

    let cancelled = false;

    api
      .getMe()
      .then((result) => {
        if (cancelled) return;
        setUser(result.user);
        localStorage.setItem(USER_KEY, JSON.stringify(result.user));
      })
      .catch(() => {
        // A 401 has already logged out through the interceptor; anything
        // else (server down) leaves the saved user in place.
      })
      .finally(() => {
        if (!cancelled) setChecking(false);
      });

    return () => {
      cancelled = true;
    };
    // Only when the token changes - not on every render.
  }, [token]);

  function saveSession(result) {
    localStorage.setItem(TOKEN_KEY, result.token);
    localStorage.setItem(USER_KEY, JSON.stringify(result.user));
    setToken(result.token);
    setUser(result.user);
  }

  const login = useCallback(async (email, password) => {
    saveSession(await api.login(email, password));
  }, []);

  const register = useCallback(async (name, email, password) => {
    saveSession(await api.register(name, email, password));
  }, []);

  // Memoised so components reading the context do not re-render every time
  // the provider does.
  const value = useMemo(
    () => ({ token, user, checking, isLoggedIn: Boolean(token), login, register, logout }),
    [token, user, checking, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// One import for any component that needs the session, and a clear error if
// it is ever used outside the provider.
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth has to be used inside an AuthProvider.");
  return context;
}
