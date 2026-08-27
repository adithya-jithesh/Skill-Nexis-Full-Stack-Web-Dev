import Button from "./Button";

/**
 * Header - site banner with a live project count and a theme toggle.
 *
 * Props:
 *   title       heading text
 *   subtitle    supporting line
 *   count       number of projects currently in state (updates live)
 *   theme       "dark" | "light" - owned by App
 *   onToggleTheme  function from App that flips the theme
 *
 * `count` is the interesting one: App keeps the projects array in state,
 * passes its length down here, and this header re-renders automatically
 * whenever a project is added or removed. Nothing here tracks it manually.
 */
function Header({ title, subtitle, count, theme, onToggleTheme }) {
  return (
    <header className="header">
      <div className="header__text">
        <h1 className="header__title">{title}</h1>
        <p className="header__subtitle">{subtitle}</p>
      </div>

      <div className="header__meta">
        <span className="badge">
          {count} {/* ternary: pick the right word for the number */}
          {count === 1 ? " project" : " projects"}
        </span>

        <Button variant="ghost" onClick={onToggleTheme}>
          {theme === "dark" ? "Light mode" : "Dark mode"}
        </Button>
      </div>
    </header>
  );
}

export default Header;
