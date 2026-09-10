import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Field from "../components/Field";
import { useAuth } from "../context/AuthContext";
import { collectErrors, validateEmail, validatePassword } from "../validation";

function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [failure, setFailure] = useState("");
  const [busy, setBusy] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    // Clear that field's error as soon as it is being fixed - leaving a
    // message under a field someone is already retyping is just noise.
    setErrors((current) => ({ ...current, [name]: "" }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFailure("");

    const found = collectErrors({
      email: validateEmail(form.email),
      password: validatePassword(form.password),
    });

    if (Object.keys(found).length > 0) {
      setErrors(found);
      return;
    }

    setBusy(true);

    try {
      await login(form.email.trim(), form.password);
      // Back to wherever they were headed before the guard sent them here,
      // or the task list if they came to the login page directly.
      navigate(location.state?.from || "/tasks", { replace: true });
    } catch (error) {
      setFailure(error.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card card--form">
      <h1>Welcome back</h1>
      <p className="muted">Log in to see your tasks.</p>

      {failure && <p className="alert alert--error">{failure}</p>}

      {/* noValidate turns off the browser's own bubbles, so the messages
          from validation.js are the only ones shown. */}
      <form onSubmit={handleSubmit} noValidate>
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
