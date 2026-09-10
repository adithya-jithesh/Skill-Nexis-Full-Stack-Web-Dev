// Every call to the backend goes through this file. Week 2's front end used
// fetch; this one uses axios, which is what the Week 3 topics ask for. The
// difference that matters is interceptors: the token gets attached and a
// dead session gets handled in one place instead of in every request.

import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5003";

export const client = axios.create({ baseURL: API_URL });

// Where the token lives between page loads. The auth context owns it; this
// file only reads it, so both agree on the key.
export const TOKEN_KEY = "todo_token";

// Runs before every request leaves the browser and adds the header the
// backend's protect middleware reads.
client.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = "Bearer " + token;
  return config;
});

// Called when the session is no longer valid. The auth context registers the
// real function here, so this file does not have to import React.
let onUnauthorised = () => {};
export function setUnauthorisedHandler(handler) {
  onUnauthorised = handler;
}

// Runs on every response. Two jobs: turn the backend's { success, message }
// failures into a plain Error, and log out on a 401 wherever it happens.
client.interceptors.response.use(
  (response) => response.data,
  (error) => {
    // No response at all means the request never got through - usually the
    // server is not running.
    if (!error.response) {
      return Promise.reject(new Error("Cannot reach the API at " + API_URL + ". Is the backend running?"));
    }

    const { status, data } = error.response;

    // The token has expired or is not accepted any more. Every screen would
    // otherwise need its own copy of this check.
    if (status === 401) onUnauthorised();

    const wrapped = new Error(data?.message || "Request failed.");
    wrapped.status = status;
    return Promise.reject(wrapped);
  }
);

export const api = {
  register: (name, email, password) => client.post("/api/auth/register", { name, email, password }),

  login: (email, password) => client.post("/api/auth/login", { email, password }),

  getMe: () => client.get("/api/auth/me"),

  // The filters are query parameters, so the filtering happens in MongoDB
  // rather than over a copy of the list in the browser.
  getTasks: ({ completed = "", priority = "", search = "" } = {}) =>
    client.get("/api/tasks", {
      params: {
        ...(completed !== "" ? { completed } : {}),
        ...(priority ? { priority } : {}),
        ...(search ? { search } : {}),
      },
    }),

  getStats: () => client.get("/api/tasks/stats"),

  getTask: (id) => client.get("/api/tasks/" + id),

  createTask: (task) => client.post("/api/tasks", task),

  updateTask: (id, updates) => client.put("/api/tasks/" + id, updates),

  toggleTask: (id) => client.patch("/api/tasks/" + id + "/toggle"),

  deleteTask: (id) => client.delete("/api/tasks/" + id),
};
