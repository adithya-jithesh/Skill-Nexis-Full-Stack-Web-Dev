import { useEffect, useRef, useState } from "react";
import Avatar from "../components/Avatar";
import Field from "../components/Field";
import { useAuth } from "../context/AuthContext";
import { validateName } from "../validation";

// Has to match the server: 1 MB, and these four types.
const MAX_BYTES = 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/gif", "image/webp"];

function formatSize(bytes) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function Profile() {
  const { user, updateName, uploadAvatar } = useAuth();

  const [name, setName] = useState(user?.name || "");
  const [nameError, setNameError] = useState("");
  const [failure, setFailure] = useState("");
  const [notice, setNotice] = useState("");
  const [savingName, setSavingName] = useState(false);

  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [progress, setProgress] = useState(null);
  const inputRef = useRef(null);

  // The preview points at the file already in the browser's memory. The
  // browser keeps that object until it is revoked, so revoking it when the
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

  async function handleName(event) {
    event.preventDefault();
    setFailure("");

    const problem = validateName(name);

    if (problem) {
      setNameError(problem);
      return;
    }

    setSavingName(true);

    try {
      await updateName(name.trim());
      setNotice("Name saved.");
    } catch (error) {
      setFailure(error.message);
    } finally {
      setSavingName(false);
    }
  }

  // The same checks the server makes. It is still the server's decision -
  // this only saves uploading a file that will be refused.
  function pick(candidate) {
    if (!candidate) return;

    if (!ALLOWED.includes(candidate.type)) {
      setFailure("That is not a JPEG, PNG, GIF or WebP image.");
      setFile(null);
      return;
    }

    if (candidate.size > MAX_BYTES) {
      setFailure("That image is " + formatSize(candidate.size) + ". The limit is 1 MB.");
      setFile(null);
      return;
    }

    setFailure("");
    setFile(candidate);
  }

  async function handleAvatar(event) {
    event.preventDefault();

    if (!file) {
      setFailure("Pick an image first.");
      return;
    }

    setFailure("");
    setProgress(0);

    try {
      await uploadAvatar(file, setProgress);
      setNotice("Avatar updated.");
      setFile(null);
      // The file input's value is the browser's, not React's, so it has to
      // be cleared by hand.
      if (inputRef.current) inputRef.current.value = "";
    } catch (error) {
      setFailure(error.message);
    } finally {
      setProgress(null);
    }
  }

  return (
    <div className="card card--form">
      <div className="page-head">
        <h1>Profile</h1>
        <p className="muted">{user?.email}</p>
      </div>

      {failure && <p className="alert alert--error">{failure}</p>}
      {notice && <p className="alert alert--ok">{notice}</p>}

      <form onSubmit={handleAvatar} className="profile__avatar">
        <div className="profile__preview">
          {/* Before uploading: the picked file, drawn from memory. After:
              whatever the server has, which is what everyone else sees. */}
          {preview ? (
            <img className="avatar avatar--large" src={preview} alt="" />
          ) : (
            <Avatar user={user} size={96} />
          )}
        </div>

        <div className="profile__avatar-actions">
          <label className="btn btn--ghost" htmlFor="avatar">
            Choose an image
          </label>
          <input
            ref={inputRef}
            id="avatar"
            type="file"
            className="visually-hidden"
            accept="image/jpeg,image/png,image/gif,image/webp"
            onChange={(event) => pick(event.target.files?.[0])}
          />

          <p className="muted profile__hint">
            {file ? file.name + " - " + formatSize(file.size) : "JPEG, PNG, GIF or WebP, up to 1 MB."}
          </p>

          {progress !== null && (
            <div
              className="progress"
              role="progressbar"
              aria-valuenow={progress}
              aria-valuemin="0"
              aria-valuemax="100"
            >
              <div className="progress__fill" style={{ width: progress + "%" }} />
              <span className="progress__label">{progress}%</span>
            </div>
          )}

          <button
            type="submit"
            className="btn btn--primary"
            disabled={!file || progress !== null}
          >
            {progress !== null ? "Uploading..." : "Upload avatar"}
          </button>
        </div>
      </form>

      <hr className="rule" />

      <form onSubmit={handleName} noValidate>
        <Field
          label="Display name"
          name="name"
          value={name}
          error={nameError}
          onChange={(event) => {
            setName(event.target.value);
            setNameError("");
          }}
        />

        <button type="submit" className="btn btn--primary" disabled={savingName}>
          {savingName ? "Saving..." : "Save name"}
        </button>
      </form>

      <p className="muted profile__note">
        Changing an email means checking it is not already taken and issuing a new token, and
        changing a password means asking for the old one first - neither is part of this
        assignment, so the name is the only thing editable here.
      </p>
    </div>
  );
}

export default Profile;
