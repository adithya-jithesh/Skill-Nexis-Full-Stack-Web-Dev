// Button - small reusable button, same idea as in assignment 2.
// Props: children (the label), color, onClick.

function Button({ children, color = "", onClick }) {
  return (
    <button type="button" className={"btn " + color} onClick={onClick}>
      {children}
    </button>
  );
}

export default Button;
