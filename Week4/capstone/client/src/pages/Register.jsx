import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Field from "../components/Field";
import { useAuth } from "../context/AuthContext";
import {
  collectErrors,
  validateEmail,
  validateName,
  validatePassword,
  validateUsername,
} from "../validation";

function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
    confirm: "",
  });
  const [errors, setErrors] = useState({});
  const [failure, setFailure] = useState("");
  const [busy, setBusy] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: "" }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFailure("");

    const found = collectErrors({
      name: validateName(form.name),
      username: validateUsername(form.username),
      email: validateEmail(form.email),
      password: validatePassword(form.password),
      // The one rule the server does not have, because it is never sent the
      // second copy - it exists only to catch a typo here.
      confirm: form.confirm !== form.password ? "The two passwords do not match." : "",
    });

    if (Object.keys(found).length > 0) {
      setErrors(found);
      return;
    }

    setBusy(true);

    try {
      await register({
        name: form.name.trim(),
        // Stored lowercase by the schema; lowercased here too so what was
        // typed matches what the profile URL will be.
        username: form.username.trim().toLowerCase(),
        email: form.email.trim(),
        password: form.password,
      });
      navigate("/", { replace: true });
    } catch (error) {
      setFailure(error.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card card--form">
      <h1>Create an account</h1>
      <p className="muted">Your username is how people find you.</p>

      {failure && <p className="alert alert--error">{failure}</p>}

      <form onSubmit={handleSubmit} noValidate>
        <Field
          label="Name"
          name="name"
          autoComplete="name"
          value={form.name}
          onChange={handleChange}
          error={errors.name}
        />

        <Field
          label="Username"
          name="username"
          autoComplete="username"
          value={form.username}
          onChange={handleChange}
          error={errors.username}
          hint="Letters, numbers and underscores."
        />

        <Field
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          value={form.email}
          onChange={handleChange}
          error={errors.email}
          placeholder="you@example.com"
        />

        <Field
          label="Password"
          name="password"
          type="password"
          autoComplete="new-password"
          value={form.password}
          onChange={handleChange}
          error={errors.password}
          hint="At least 8 characters."
        />

        <Field
          label="Confirm password"
          name="confirm"
          type="password"
          autoComplete="new-password"
          value={form.confirm}
          onChange={handleChange}
          error={errors.confirm}
        />

        <button type="submit" className="btn btn--primary btn--block" disabled={busy}>
          {busy ? "Creating..." : "Create account"}
        </button>
      </form>

      <p className="muted">
        Already have one? <Link to="/login">Log in</Link>
      </p>
    </div>
  );
}

export default Register;
