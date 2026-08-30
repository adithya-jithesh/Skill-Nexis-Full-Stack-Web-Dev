// Button - a reusable button used by the other components.
// Props: children (the label), color, type, onClick, disabled.

function Button({ children, color = "", type = "button", onClick, disabled = false }) {
  return (
    <button
      type={type}
      className={"btn " + color}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

export default Button;
