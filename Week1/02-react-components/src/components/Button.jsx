/**
 * Button - the most reusable component in the set.
 *
 * Props:
 *   children  the button's label (whatever you put between the tags)
 *   variant   "primary" | "ghost" | "danger"  → picks a CSS class
 *   type      "button" | "submit"
 *   onClick   function to run when clicked
 *   disabled  boolean
 *
 * Note `variant = "primary"` in the parameter list: that's a DEFAULT
 * parameter. If the parent doesn't pass `variant`, it becomes "primary".
 */
function Button({
  children,
  variant = "primary",
  type = "button",
  onClick,
  disabled = false,
}) {
  return (
    <button
      type={type}
      className={`btn btn--${variant}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

export default Button;
