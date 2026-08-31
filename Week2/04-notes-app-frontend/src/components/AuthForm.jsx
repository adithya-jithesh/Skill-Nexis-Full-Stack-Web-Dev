import { useState } from "react";

// AuthForm - the log in / sign up screen, shown while nobody is logged in.
// Props: onLogin(email, password), onRegister(name, email, password), error.
// It keeps what is typed in its own state and hands the finished values up
// to App, which owns the token.

function AuthForm({ onLogin, onRegister, error }) {
  // One form does both jobs; this decides which.
  const [mode, setMode] = useState("login");
  const [values, setValues] = useState({ name: "", email: "", password: "" });
  const [busy, setBusy] = useState(false);

  const isRegister = mode === "register";

  function handleChange(event) {
    setValues({ ...values, [event.target.name]: event.target.value });
  }

  async function handleSubmit(event) {
    event.preventDefault();

    // Stops a second submit while the first request is still in flight.
    setBusy(true);

    if (isRegister) {
      await onRegister(values.name, values.email, values.password);
    } else {
      await onLogin(values.email, values.password);
    }

    setBusy(false);
  }

  return (
    <div className="auth">
      <h2>{isRegister ? "Create an account" : "Log in"}</h2>
      <p className="auth__hint">
        {isRegister
          ? "Your notes are private to this account."
          : "Log in to see your notes."}
      </p>

      <form onSubmit={handleSubmit}>
        {/* the name box only exists when signing up */}
        {isRegister && (
          <>
            <label htmlFor="name">Name</label>
            <input
              id="name"
              name="name"
              value={values.name}
              onChange={handleChange}
              autoComplete="name"
            />
          </>
        )}

        <label htmlFor="email">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          value={values.email}
          onChange={handleChange}
          autoComplete="email"
        />

        <label htmlFor="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          value={values.password}
          onChange={handleChange}
          autoComplete={isRegister ? "new-password" : "current-password"}
        />
        {isRegister && <p className="hint">At least 8 characters.</p>}

        {/* whatever the API said went wrong */}
        {error && <p className="error">{error}</p>}

        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? "Please wait..." : isRegister ? "Sign up" : "Log in"}
        </button>
      </form>

      <p className="auth__switch">
        {isRegister ? "Already have an account?" : "No account yet?"}{" "}
        <button
          type="button"
          className="link-btn"
          onClick={() => setMode(isRegister ? "login" : "register")}
        >
          {isRegister ? "Log in" : "Sign up"}
        </button>
      </p>
    </div>
  );
}

export default AuthForm;
