import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Field from "../components/Field";
import { useAuth } from "../context/AuthContext";
import { collectErrors, validatePassword } from "../validation";

function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({ identifier: "", password: "" });
  const [errors, setErrors] = useState({});
  const [failure, setFailure] = useState("");
  const [busy, setBusy] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    // Clear that field's error as soon as it is being fixed.
    setErrors((current) => ({ ...current, [name]: "" }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFailure("");

    // The identifier is an email or a username, so it cannot be checked
    // against either shape - only that something was typed.
    const found = collectErrors({
      identifier: form.identifier.trim() ? "" : "Enter your email or username.",
      password: validatePassword(form.password),
    });

    if (Object.keys(found).length > 0) {
      setErrors(found);
      return;
    }

    setBusy(true);

    try {
      await login(form.identifier.trim(), form.password);
      // Back where they were headed before the guard sent them here.
      navigate(location.state?.from || "/", { replace: true });
    } catch (error) {
      setFailure(error.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card card--form">
      <h1>Welcome back</h1>
      <p className="muted">Log in with your email or your username.</p>

      {failure && <p className="alert alert--error">{failure}</p>}

      {/* noValidate turns off the browser's own bubbles, so the messages from
          validation.js are the only ones shown. */}
      <form onSubmit={handleSubmit} noValidate>
        <Field
          label="Email or username"
          name="identifier"
          autoComplete="username"
          value={form.identifier}
          onChange={handleChange}
          error={errors.identifier}
        />

        <Field
          label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
          value={form.password}
          onChange={handleChange}
          error={errors.password}
        />

        <button type="submit" className="btn btn--primary btn--block" disabled={busy}>
          {busy ? "Logging in..." : "Log in"}
        </button>
      </form>

      <p className="muted">
        No account yet? <Link to="/register">Create one</Link>
      </p>
    </div>
  );
}

export default Login;
