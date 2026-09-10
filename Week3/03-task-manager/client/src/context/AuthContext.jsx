import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api, setUnauthorisedHandler, TOKEN_KEY } from "../api";

// Who is logged in is needed by the navbar, the route guard, both auth pages,
// the board and the profile page. Threading that through as props would mean
// passing it through every component in between, so it lives here.
const AuthContext = createContext(null);

const USER_KEY = "taskman_user";

export function AuthProvider({ children }) {
  // Read from localStorage on the first render, so a refresh does not flash
  // the login screen before the session is restored.
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

  // Keeps React state and localStorage in step - every path that changes the
  // user goes through here.
  const storeUser = useCallback((next) => {
    localStorage.setItem(USER_KEY, JSON.stringify(next));
    setUser(next);
  }, []);

  // A saved token only means one was saved at some point: it can be expired,
  // or belong to an account that has been deleted. /me is the cheapest way to
  // find out, and it also picks up a name or avatar changed elsewhere.
  useEffect(() => {
    if (!token) {
      setChecking(false);
      return;
    }

    let cancelled = false;

    api
      .getMe()
      .then((result) => {
        if (!cancelled) storeUser(result.user);
      })
      .catch(() => {
        // A 401 has already logged out through the interceptor; anything
        // else (the server being down) leaves the saved user in place.
      })
      .finally(() => {
        if (!cancelled) setChecking(false);
      });

    return () => {
      cancelled = true;
    };
  }, [token, storeUser]);

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

  const updateName = useCallback(
    async (name) => {
      const result = await api.updateMe(name);
      storeUser(result.user);
    },
    [storeUser]
  );

  const uploadAvatar = useCallback(
    async (file, onProgress) => {
      const result = await api.uploadAvatar(file, onProgress);
      storeUser(result.user);
    },
    [storeUser]
  );

  // Memoised, so components reading the context do not re-render every time
  // the provider does.
  const value = useMemo(
    () => ({
      token,
      user,
      checking,
      isLoggedIn: Boolean(token),
      login,
      register,
      logout,
      updateName,
      uploadAvatar,
    }),
    [token, user, checking, login, register, logout, updateName, uploadAvatar]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth has to be used inside an AuthProvider.");
  return context;
}
