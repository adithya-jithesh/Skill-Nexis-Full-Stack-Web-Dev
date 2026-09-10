import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api, setUnauthorisedHandler, TOKEN_KEY } from "../api";

// Who is logged in is read by the navbar, the route guard, the composer, every
// post card (to decide whether the delete button belongs to you) and both auth
// pages. Threading that through as props would mean passing it through every
// component in between.
const AuthContext = createContext(null);

const USER_KEY = "feed_user";

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || "");
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem(USER_KEY) || "null"));
  // True until a saved token has been checked against the server.
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

  const storeUser = useCallback((next) => {
    localStorage.setItem(USER_KEY, JSON.stringify(next));
    setUser(next);
  }, []);

  // A saved token only means one was saved at some point: it can be expired,
  // or belong to a deleted account. /me settles it, and also picks up counts
  // that changed while the tab was closed.
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
        // A 401 has already logged out through the interceptor; anything else
        // (the server being down) leaves the saved user in place.
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

  const login = useCallback(async (identifier, password) => {
    saveSession(await api.login(identifier, password));
  }, []);

  const register = useCallback(async (payload) => {
    saveSession(await api.register(payload));
  }, []);

  const updateProfile = useCallback(
    async (updates) => {
      const result = await api.updateMe(updates);
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

  // Posting and following change counts that the navbar and your own profile
  // show, so screens that do those call this rather than guessing locally.
  const refreshMe = useCallback(async () => {
    if (!localStorage.getItem(TOKEN_KEY)) return;

    try {
      const result = await api.getMe();
      storeUser(result.user);
    } catch {
      // Not worth surfacing: the counts are decoration, and a 401 has already
      // been handled by the interceptor.
    }
  }, [storeUser]);

  const value = useMemo(
    () => ({
      token,
      user,
      checking,
      isLoggedIn: Boolean(token),
      login,
      register,
      logout,
      updateProfile,
      uploadAvatar,
      refreshMe,
    }),
    [token, user, checking, login, register, logout, updateProfile, uploadAvatar, refreshMe]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth has to be used inside an AuthProvider.");
  return context;
}
