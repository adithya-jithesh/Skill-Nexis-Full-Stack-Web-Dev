import { useEffect, useRef, useState } from "react";
import { api } from "../api";

// Has to match the server: 2 MB, and these four types.
const MAX_BYTES = 2 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/gif", "image/webp"];

export function formatSize(bytes) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function UploadForm({ onUploaded }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [caption, setCaption] = useState("");
  const [error, setError] = useState("");
  const [progress, setProgress] = useState(null);
  const [dragging, setDragging] = useState(false);
  // Needed to clear the file input after a successful upload: its value is
  // controlled by the browser, not by React.
  const inputRef = useRef(null);

  // The preview is a URL pointing at the file in memory, which the browser
  // holds on to until it is revoked. Doing that when the file changes (and
  // when the component unmounts) is what stops picking ten images in a row
  // from leaking ten of them.
  useEffect(() => {
    if (!file) {
      setPreview("");
      return;
    }

    const url = URL.createObjectURL(file);
    setPreview(url);

    return () => URL.revokeObjectURL(url);
  }, [file]);

  // The same checks the server makes. It is still the server's decision -
  // this only saves uploading 5 MB to be told no.
  function accept(candidate) {
    if (!candidate) return;

    if (!ALLOWED.includes(candidate.type)) {
      setError("That is not a JPEG, PNG, GIF or WebP image.");
      setFile(null);
      return;
    }

    if (candidate.size > MAX_BYTES) {
      setError("That image is " + formatSize(candidate.size) + ". The limit is 2 MB.");
      setFile(null);
      return;
    }

    setError("");
    setFile(candidate);
  }

  function handleDrop(event) {
    event.preventDefault();
    setDragging(false);
    accept(event.dataTransfer.files?.[0]);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!file) {
      setError("Pick an image first.");
      return;
    }

    setError("");
    setProgress(0);

    try {
      const result = await api.uploadImage(file, caption.trim(), setProgress);
      onUploaded(result.data);

      // Back to an empty form, ready for the next one.
      setFile(null);
      setCaption("");
      if (inputRef.current) inputRef.current.value = "";
    } catch (uploadError) {
      setError(uploadError.message);
    } finally {
      setProgress(null);
    }
  }

  const busy = progress !== null;

  return (
    <form className="card upload" onSubmit={handleSubmit}>
      <h2>Upload an image</h2>

      {/* A label wrapping the input is what makes the whole panel clickable
          while the real <input type="file"> stays in the page for the
          keyboard and for screen readers. */}
      <label
        className={"dropzone" + (dragging ? " dropzone--over" : "")}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          className="dropzone__input"
          onChange={(event) => accept(event.target.files?.[0])}
        />

        {preview ? (
          // The preview is drawn from the file in the browser, before
          // anything is sent - nothing here has touched the server yet.
          <img src={preview} alt="" className="dropzone__preview" />
        ) : (
          <span className="dropzone__prompt">
            <strong>Choose an image</strong>
            <small>or drag one here - JPEG, PNG, GIF or WebP, up to 2 MB</small>
          </span>
        )}
      </label>

      {file && (
        <p className="upload__file">
          {file.name} <span className="muted">{formatSize(file.size)}</span>
        </p>
      )}

      <label className="field" htmlFor="caption">
        <span className="field__label">Caption</span>
        <input
          id="caption"
          className="field__input"
          value={caption}
          maxLength={140}
          onChange={(event) => setCaption(event.target.value)}
          placeholder="Optional, up to 140 characters"
        />
      </label>

      {error && <p className="alert alert--error">{error}</p>}

      {busy && (
        <div className="progress" role="progressbar" aria-valuenow={progress} aria-valuemin="0" aria-valuemax="100">
          <div className="progress__fill" style={{ width: progress + "%" }} />
          <span className="progress__label">{progress}%</span>
        </div>
      )}

      <button type="submit" className="btn btn--primary btn--block" disabled={busy || !file}>
        {busy ? "Uploading..." : "Upload"}
      </button>
    </form>
  );
}

export default UploadForm;
