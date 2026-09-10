import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Avatar from "../components/Avatar";
import Field from "../components/Field";
import { useAuth } from "../context/AuthContext";
import { collectErrors, validateBio, validateName } from "../validation";

const MAX_AVATAR = 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/gif", "image/webp"];

function formatSize(bytes) {
  if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function Settings() {
  const { user, updateProfile, uploadAvatar } = useAuth();

  const [form, setForm] = useState({ name: user?.name || "", bio: user?.bio || "" });
  const [errors, setErrors] = useState({});
  const [failure, setFailure] = useState("");
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);

  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [progress, setProgress] = useState(null);
  const inputRef = useRef(null);

  // The browser holds the object URL until it is revoked, so revoking it when
  // the file changes is what stops picking several in a row from leaking them.
  useEffect(() => {
    if (!file) {
      setPreview("");
      return;
    }

    const url = URL.createObjectURL(file);
    setPreview(url);

    return () => URL.revokeObjectURL(url);
  }, [file]);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: "" }));
  }

  async function handleSave(event) {
    event.preventDefault();
    setFailure("");
    setNotice("");

    const found = collectErrors({
      name: validateName(form.name),
      bio: validateBio(form.bio),
    });

    if (Object.keys(found).length > 0) {
      setErrors(found);
      return;
    }

    setSaving(true);

    try {
      await updateProfile({ name: form.name.trim(), bio: form.bio.trim() });
      setNotice("Profile saved.");
    } catch (error) {
      setFailure(error.message);
    } finally {
      setSaving(false);
    }
  }

  // The same checks the server makes - this only saves uploading a file that
  // will be refused.
  function pick(candidate) {
    if (!candidate) return;

    if (!ALLOWED.includes(candidate.type)) {
      setFailure("That is not a JPEG, PNG, GIF or WebP image.");
      setFile(null);
      return;
    }

    if (candidate.size > MAX_AVATAR) {
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
    setNotice("");
    setProgress(0);

    try {
      await uploadAvatar(file, setProgress);
      setNotice("Avatar updated.");
      setFile(null);
      // The file input's value belongs to the browser, not to React.
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
        <h1>Your profile</h1>
        <p className="muted">
          @{user?.username} &middot; {user?.email}
        </p>
      </div>

      {failure && <p className="alert alert--error">{failure}</p>}
      {notice && <p className="alert alert--ok">{notice}</p>}

      <form onSubmit={handleAvatar} className="settings__avatar">
        <div>
          {/* Before uploading: the picked file, drawn from memory. After: what
              the server has, which is what everyone else sees. */}
          {preview ? (
            <img className="avatar avatar--large" src={preview} alt="" />
          ) : (
            <Avatar user={user} size={88} linked={false} />
          )}
        </div>

        <div className="settings__avatar-actions">
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

          <p className="muted settings__hint">
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

          <button type="submit" className="btn btn--primary" disabled={!file || progress !== null}>
            {progress !== null ? "Uploading..." : "Upload avatar"}
          </button>
        </div>
      </form>

      <hr className="rule" />

      <form onSubmit={handleSave} noValidate>
        <Field
          label="Display name"
          name="name"
          value={form.name}
          onChange={handleChange}
          error={errors.name}
        />

        <Field label="Bio" name="bio" error={errors.bio} hint={160 - form.bio.length + " left"}>
          <textarea
            id="bio"
            name="bio"
            className="field__input"
            rows={3}
            maxLength={160}
            value={form.bio}
            onChange={handleChange}
            placeholder="Something about you"
          />
        </Field>

        <button type="submit" className="btn btn--primary" disabled={saving}>
          {saving ? "Saving..." : "Save profile"}
        </button>
      </form>

      <p className="muted settings__note">
        The username and email are fixed here: changing an email means checking it is not already
        taken and issuing a new token, and changing a password means asking for the old one first.
        Neither is part of this project.
      </p>

      <Link to={"/u/" + user?.username} className="back-link">
        &larr; Back to your profile
      </Link>
    </div>
  );
}

export default Settings;
