// Every call to the backend goes through this file, so the components never
// deal with fetch, headers or error shapes themselves.

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5002";

// The backend answers { success, message } when something goes wrong. This
// turns that into a thrown Error, so a component can use try/catch instead
// of checking response.ok everywhere.
async function request(path, { method = "GET", body, token } = {}) {
  let response;

  try {
    response = await fetch(API_URL + path, {
      method,
      headers: {
        ...(body ? { "Content-Type": "application/json" } : {}),
        // This header is what the backend's protect middleware reads.
        ...(token ? { Authorization: "Bearer " + token } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    // fetch only rejects when the request never got through at all - the
    // usual cause is the server not running.
    throw new Error("Cannot reach the API at " + API_URL + ". Is the backend running?");
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.message || "Request failed.");
    error.status = response.status;
    throw error;
  }

  return data;
}

export const api = {
  register: (name, email, password) =>
    request("/api/auth/register", { method: "POST", body: { name, email, password } }),

  login: (email, password) =>
    request("/api/auth/login", { method: "POST", body: { email, password } }),

  getNotes: (token, { search = "", tag = "" } = {}) => {
    // URLSearchParams escapes the values, so a search for "c++" or "&"
    // cannot break the URL.
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (tag) params.set("tag", tag);

    const query = params.toString();
    return request("/api/notes" + (query ? "?" + query : ""), { token });
  },

  getTags: (token) => request("/api/notes/tags", { token }),

  createNote: (token, note) => request("/api/notes", { method: "POST", body: note, token }),

  updateNote: (token, id, updates) =>
    request("/api/notes/" + id, { method: "PUT", body: updates, token }),

  togglePin: (token, id) => request("/api/notes/" + id + "/pin", { method: "PATCH", token }),

  deleteNote: (token, id) => request("/api/notes/" + id, { method: "DELETE", token }),
};
