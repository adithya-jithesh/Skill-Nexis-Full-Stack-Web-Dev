import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5004";

const client = axios.create({ baseURL: API_URL });

// The API answers { success, message } when something goes wrong. This turns
// that into a thrown Error carrying the server's own wording, so a component
// can use try/catch and show the message as it is.
client.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (!error.response) {
      return Promise.reject(
        new Error("Cannot reach the API at " + API_URL + ". Is the backend running?")
      );
    }

    const wrapped = new Error(error.response.data?.message || "Request failed.");
    wrapped.status = error.response.status;
    return Promise.reject(wrapped);
  }
);

// The images are served by the API, not by Vite, so a stored url has to be
// turned into an absolute one before it can go in a src attribute.
export const fileUrl = (image) => API_URL + image.url;

export const api = {
  getImages: () => client.get("/api/images"),

  deleteImage: (id) => client.delete("/api/images/" + id),

  // A file cannot go in JSON, so this posts FormData instead. The
  // Content-Type header is deliberately not set: the browser has to write it
  // itself, because it includes the multipart boundary that separates the
  // parts, and a hand-written header would leave that out.
  uploadImage: (file, caption, onProgress) => {
    const form = new FormData();
    form.append("image", file); // the field name the server's upload.single() expects
    form.append("caption", caption);

    return client.post("/api/images", form, {
      // axios reports bytes as they go out. With fetch this needs a
      // ReadableStream and a good deal more code.
      onUploadProgress: (event) => {
        if (!onProgress || !event.total) return;
        onProgress(Math.round((event.loaded / event.total) * 100));
      },
    });
  },
};
