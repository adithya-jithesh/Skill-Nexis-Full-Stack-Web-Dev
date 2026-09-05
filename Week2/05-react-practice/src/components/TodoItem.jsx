import styles from "./TodoItem.module.css";

// TodoItem - one row in the list. It holds no state of its own: it shows
// the props it is given and calls back up to the page when clicked.
// Props: id, text, done, onToggle, onDelete.

function TodoItem({ id, text, done, onToggle, onDelete }) {
  return (
    <li className={done ? styles.item + " " + styles.itemDone : styles.item}>
      <label className={styles.label}>
        <input
          className={styles.checkbox}
          type="checkbox"
          checked={done}
          onChange={() => onToggle(id)}
        />
        <span className={styles.text}>{text}</span>
      </label>

      {/* An arrow function, so the click calls onDelete rather than the
          render calling it straight away. */}
      <button
        className={styles.delete}
        type="button"
        aria-label={"Delete " + text}
        onClick={() => onDelete(id)}
      >
        Delete
      </button>
    </li>
  );
}

export default TodoItem;
