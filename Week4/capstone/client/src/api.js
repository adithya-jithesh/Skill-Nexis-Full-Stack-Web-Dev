// Every call to the backend goes through this file, so no component deals
// with headers, error shapes or the base URL.

import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5006";

export const client = axios.create({ baseURL: API_URL });

export const TOKEN_KEY = "feed_token";

// Attaches the token to every outgoing request - what protect() and
// optionalAuth() read on the server.
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

// Images are served by the API, not by Vite, so a stored path has to be made
// absolute before it can go in a src attribute.
export const fileUrl = (path) => (path ? API_URL + path : "");

export const api = {
  register: (payload) => client.post("/api/auth/register", payload),

  login: (identifier, password) => client.post("/api/auth/login", { identifier, password }),

  getMe: () => client.get("/api/auth/me"),

  updateMe: (updates) => client.put("/api/auth/me", updates),

  uploadAvatar: (file, onProgress) => upload("/api/auth/me/avatar", "avatar", file, {}, onProgress),

  // scope: "everyone" | "following"; username narrows it to one person.
  getPosts: (params) => client.get("/api/posts", { params }),

  getPost: (id) => client.get("/api/posts/" + id),

  // Always multipart, whether or not there is an image - one code path rather
  // than two, and the server reads text out of req.body either way.
  createPost: (text, image, onProgress) =>
    upload("/api/posts", "image", image, { text }, onProgress),

  deletePost: (id) => client.delete("/api/posts/" + id),

  toggleLike: (id) => client.post("/api/posts/" + id + "/like"),

  getLikes: (id) => client.get("/api/posts/" + id + "/likes"),

  getComments: (id) => client.get("/api/posts/" + id + "/comments"),

  createComment: (id, text) => client.post("/api/posts/" + id + "/comments", { text }),

  deleteComment: (id) => client.delete("/api/comments/" + id),

  getUsers: (params) => client.get("/api/users", { params }),

  getUser: (username) => client.get("/api/users/" + username),

  toggleFollow: (username) => client.post("/api/users/" + username + "/follow"),

  getFollowers: (username) => client.get("/api/users/" + username + "/followers"),

  getFollowing: (username) => client.get("/api/users/" + username + "/following"),
};

// A file cannot go in JSON, so anything carrying one is sent as FormData. The
// Content-Type header is deliberately not set: the browser writes it itself,
// because it has to include the multipart boundary that separates the parts.
function upload(path, fileField, file, fields, onProgress) {
  const form = new FormData();

  for (const [key, value] of Object.entries(fields)) form.append(key, value);
  if (file) form.append(fileField, file);

  return client.post(path, form, {
    onUploadProgress: (event) => {
      if (!onProgress || !event.total) return;
      onProgress(Math.round((event.loaded / event.total) * 100));
    },
  });
}
