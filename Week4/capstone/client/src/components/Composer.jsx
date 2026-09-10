import { useEffect, useRef, useState } from "react";
import { api } from "../api";
import Avatar from "./Avatar";
import { useAuth } from "../context/AuthContext";

const MAX_TEXT = 500;
const MAX_IMAGE = 4 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/gif", "image/webp"];

function formatSize(bytes) {
  if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

// Writing a post: text, an optional image, and the counter that tells you how
// much room is left.
function Composer({ onPosted }) {
  const { user, refreshMe } = useAuth();

  const [text, setText] = useState("");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [error, setError] = useState("");
  const [progress, setProgress] = useState(null);
  const inputRef = useRef(null);

  // The preview points at the file already in the browser's memory. The
  // browser holds that object until it is revoked, so revoking it when the
  // file changes is what stops picking several in a row from leaking them.
  useEffect(() => {
    if (!file) {
      setPreview("");
      return;
    }

    const url = URL.createObjectURL(file);
    setPreview(url);

    return () => URL.revokeObjectURL(url);
  }, [file]);

  // The same checks the server makes - this only saves uploading 5 MB to be
  // told no.
  function pick(candidate) {
    if (!candidate) return;

    if (!ALLOWED.includes(candidate.type)) {
      setError("That is not a JPEG, PNG, GIF or WebP image.");
      return;
    }

    if (candidate.size > MAX_IMAGE) {
      setError("That image is " + formatSize(candidate.size) + ". The limit is 4 MB.");
      return;
    }

    setError("");
    setFile(candidate);
  }

  function clearImage() {
    setFile(null);
    // The file input's value belongs to the browser, not to React, so
    // forgetting the file is not enough to let the same one be picked again.
    if (inputRef.current) inputRef.current.value = "";
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!text.trim()) {
      setError("Say something first.");
      return;
    }

    setError("");
    setProgress(0);

    try {
      const result = await api.createPost(text.trim(), file, setProgress);

      onPosted(result.data);
      setText("");
      clearImage();
      // The post count on the profile just changed.
      refreshMe();
    } catch (postError) {
      setError(postError.message);
    } finally {
      setProgress(null);
    }
  }

  const left = MAX_TEXT - text.length;
  const busy = progress !== null;

  return (
    <form className="composer" onSubmit={handleSubmit}>
      <Avatar user={user} size={44} linked={false} />

      <div className="composer__body">
        <textarea
          className="composer__text"
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="What's happening?"
          rows={3}
          maxLength={MAX_TEXT}
          aria-label="Write a post"
        />

        {preview && (
          <div className="composer__preview">
            {/* Drawn from the file in the browser - nothing has been sent yet. */}
            <img src={preview} alt="" />
            <button type="button" className="composer__remove" onClick={clearImage} aria-label="Remove image">
              &times;
            </button>
          </div>
        )}

        {error && <p className="alert alert--error">{error}</p>}

        {busy && (
          <div className="progress" role="progressbar" aria-valuenow={progress} aria-valuemin="0" aria-valuemax="100">
            <div className="progress__fill" style={{ width: progress + "%" }} />
            <span className="progress__label">{progress}%</span>
          </div>
        )}

        <div className="composer__foot">
          {/* A label wrapping the input, so the whole button is clickable while
              the real file input stays reachable from the keyboard. */}
          <label className="composer__attach" htmlFor="post-image">
            <span aria-hidden="true">🖼</span> Add image
          </label>
          <input
            ref={inputRef}
            id="post-image"
            type="file"
            className="visually-hidden"
            accept="image/jpeg,image/png,image/gif,image/webp"
            onChange={(event) => pick(event.target.files?.[0])}
          />

          {/* Only worth showing once it starts to matter. */}
          <span className={"composer__count" + (left <= 50 ? " composer__count--low" : "")}>
            {left <= 100 ? left : ""}
          </span>

          <button type="submit" className="btn btn--primary" disabled={busy || !text.trim()}>
            {busy ? "Posting..." : "Post"}
          </button>
        </div>
      </div>
    </form>
  );
}

export default Composer;
