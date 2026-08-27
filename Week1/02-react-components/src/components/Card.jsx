import Button from "./Button";

/**
 * Card - displays one project. Rendered once per item in the projects array.
 *
 * Props:
 *   id           unique identifier, passed back up when removing
 *   title        project name
 *   description  project summary
 *   tags         ARRAY of strings → rendered with .map()
 *   status       optional pill text, e.g. "In progress"
 *   onRemove     function passed DOWN from App; Card calls it on click
 *
 * This component holds no state of its own. Everything it shows comes from
 * props, and the only thing it does is call onRemove. That makes it a
 * "presentational" component - easy to reason about and easy to reuse.
 */
function Card({ id, title, description, tags = [], status, onRemove }) {
  return (
    <article className="card">
      <h3 className="card__title">
        {title}
        {/* Conditional rendering: `&&` renders the right side ONLY if the
            left side is truthy. No status prop → nothing renders. */}
        {status && <span className="card__status">{status}</span>}
      </h3>

      <p className="card__desc">{description}</p>

      <ul className="card__tags">
        {/* Rendering a list: .map() turns an array of strings into an array
            of JSX elements. `key` must be unique among siblings - React uses
            it to tell items apart when the list changes. */}
        {tags.map((tag) => (
          <li key={tag}>{tag}</li>
        ))}
      </ul>

      <div className="card__actions">
        {/* An arrow function so onRemove runs on CLICK, not during render.
            Writing onClick={onRemove(id)} would call it immediately. */}
        <Button variant="danger" onClick={() => onRemove(id)}>
          Remove
        </Button>
      </div>
    </article>
  );
}

export default Card;
