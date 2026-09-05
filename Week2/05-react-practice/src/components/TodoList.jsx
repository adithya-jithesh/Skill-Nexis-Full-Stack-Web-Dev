import TodoItem from "./TodoItem";
import styles from "./TodoList.module.css";

// TodoList - draws the rows, or a friendly line when there are none.
// Props: todos, onToggle, onDelete.

function TodoList({ todos, onToggle, onDelete }) {
  if (todos.length === 0) {
    return <p className={styles.empty}>Nothing here yet. Add your first task above.</p>;
  }

  return (
    <ul className={styles.list}>
      {todos.map((todo) => (
        // key lets React tell the rows apart when one is deleted. The id
        // is used rather than the array index, which would shift.
        <TodoItem
          key={todo.id}
          id={todo.id}
          text={todo.text}
          done={todo.done}
          onToggle={onToggle}
          onDelete={onDelete}
        />
      ))}
    </ul>
  );
}

export default TodoList;
