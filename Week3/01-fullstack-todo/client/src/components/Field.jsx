// One labelled input with its error message underneath. Every form here uses
// it, so the error styling and the label/input wiring only exist once.
function Field({ label, name, error, hint, children, ...inputProps }) {
  return (
    <label className={"field" + (error ? " field--invalid" : "")} htmlFor={name}>
      <span className="field__label">{label}</span>

      {/* Either a custom control (a select, a textarea) or a plain input. */}
      {children || <input id={name} name={name} className="field__input" {...inputProps} />}

      {/* role="alert" so a screen reader announces the message when it
          appears, rather than leaving it silently on the page. */}
      {error ? (
        <span className="field__error" role="alert">
          {error}
        </span>
      ) : (
        hint && <span className="field__hint">{hint}</span>
      )}
    </label>
  );
}

export default Field;
