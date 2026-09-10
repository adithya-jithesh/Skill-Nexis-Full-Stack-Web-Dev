import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { io } from "socket.io-client";
import { TOKEN_KEY } from "../api";
import { useAuth } from "./AuthContext";

// One socket for the whole app, shared through context.
//
// The REST API is still what changes anything; this only carries word that
// something changed, so other people's screens keep up without a reload. If it
// never connects - a blocked network, a host that does not do WebSockets - the
// app still works exactly as it did in phase 2. Nothing here is load-bearing.
const RealtimeContext = createContext(null);

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5006";

export function RealtimeProvider({ children }) {
  const { token } = useAuth();

  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [online, setOnline] = useState(0);

  useEffect(() => {
    // Reconnecting with the new token is the point of keying this on `token`:
    // logging in has to re-handshake, or the socket stays anonymous and never
    // joins the personal room that carries the following feed.
    const socket = io(API_URL, {
      auth: { token: localStorage.getItem(TOKEN_KEY) || "" },
      // Reconnection is Socket.IO's own, with a backoff - a free host that
      // sleeps between requests will drop the connection regularly.
      reconnectionDelay: 1000,
      reconnectionDelayMax: 8000,
    });

    socketRef.current = socket;

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));
    socket.on("presence", (data) => setOnline(data.online));

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
    };
  }, [token]);

  const value = useMemo(() => ({ socket: socketRef, connected, online }), [connected, online]);

  return <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>;
}

export function useRealtime() {
  const context = useContext(RealtimeContext);
  if (!context) throw new Error("useRealtime has to be used inside a RealtimeProvider.");
  return context;
}

// Subscribe to one event for as long as a component is mounted.
//
// The handler is kept in a ref so that changing it does not tear the listener
// down and put it back on every render - which would otherwise happen
// constantly, since handlers are usually inline arrow functions.
export function useRealtimeEvent(event, handler) {
  const { socket, connected } = useRealtime();
  const saved = useRef(handler);

  useEffect(() => {
    saved.current = handler;
  }, [handler]);

  useEffect(() => {
    const current = socket.current;
    if (!current) return;

    const listener = (...args) => saved.current(...args);
    current.on(event, listener);

    return () => current.off(event, listener);
    // `connected` is in here so the listener is attached again after a
    // reconnect, when the underlying socket instance may have changed.
  }, [socket, event, connected]);
}
