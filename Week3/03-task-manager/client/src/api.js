// Every call to the backend goes through this file, so no component deals
// with headers, error shapes or the base URL.

import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5005";

export const client = axios.create({ baseURL: API_URL });

export const TOKEN_KEY = "taskman_token";

// Attaches the token to every outgoing request. This is what protect() on
// the server reads.
client.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = "Bearer " + token;
  return config;
});

// The auth context registers the real function here, so this file does not
// have to import React.
let onUnauthorised = () => {};
export function setUnauthorisedHandler(handler) {
  onUnauthorised = handler;
}

client.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (!error.response) {
      return Promise.reject(
        new Error("Cannot reach the API at " + API_URL + ". Is the backend running?")
      );
    }

    const { status, data } = error.response;

    // The session is over wherever this happened, so it is handled once here
    // rather than in every screen.
    if (status === 401) onUnauthorised();

    const wrapped = new Error(data?.message || "Request failed.");
    wrapped.status = status;
    return Promise.reject(wrapped);
  }
);

// Avatars are served by the API, not by Vite, so a stored path has to be
// made absolute before it can go in a src attribute.
export const fileUrl = (path) => (path ? API_URL + path : "");

export const api = {
  register: (name, email, password) => client.post("/api/auth/register", { name, email, password }),

  login: (email, password) => client.post("/api/auth/login", { email, password }),

  getMe: () => client.get("/api/auth/me"),

  updateMe: (name) => client.put("/api/auth/me", { name }),

  // A file cannot go in JSON. The Content-Type header is deliberately not
  // set: the browser writes it itself, including the multipart boundary.
  uploadAvatar: (file, onProgress) => {
    const form = new FormData();
    form.append("avatar", file);

    return client.post("/api/auth/me/avatar", form, {
      onUploadProgress: (event) => {
        if (!onProgress || !event.total) return;
        onProgress(Math.round((event.loaded / event.total) * 100));
      },
    });
  },

  // The filters go to the server as query parameters, so MongoDB does the
  // filtering, sorting and paging - not a copy of the list in the browser.
  getTasks: (params) => client.get("/api/tasks", { params }),

  getStats: () => client.get("/api/tasks/stats"),

  getTags: () => client.get("/api/tasks/tags"),

  getTask: (id) => client.get("/api/tasks/" + id),

  createTask: (task) => client.post("/api/tasks", task),

  updateTask: (id, updates) => client.put("/api/tasks/" + id, updates),

  setStatus: (id, status) => client.patch("/api/tasks/" + id + "/status", { status }),

  deleteTask: (id) => client.delete("/api/tasks/" + id),
};
