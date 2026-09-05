import { useState } from "react";
import TodoForm from "../components/TodoForm";
import TodoList from "../components/TodoList";
import styles from "./Todos.module.css";

// Todos - practice question 3: a to-do app with add and delete.
//
// The list of tasks lives here, in the page, rather than in TodoList or
// TodoItem. Both the form and the list need it, so it is held by the
// closest component above the two of them and passed down as props.

// A counter for ids. Kept outside the component so a re-render does not
// reset it back to 1 and hand out an id that is already in use.
let nextId = 4;

const startingTodos = [
  { id: 1, text: "Finish the Week 2 backend assignments", done: true },
  { id: 2, text: "Read up on React Router", done: false },
  { id: 3, text: "Style the components with CSS modules", done: false },
];

function Todos() {
  const [todos, setTodos] = useState(startingTodos);

  // Add - a brand new array with the new task on the end. State is
  // replaced, never edited in place, or React would not notice the change.
  function handleAdd(text) {
    const task = { id: nextId, text: text, done: false };
    nextId = nextId + 1;
    setTodos([...todos, task]);
  }

  // Delete - filter keeps everything except the id that was clicked, and
  // returns a new array, so again nothing is edited in place.
  function handleDelete(id) {
    setTodos(todos.filter((todo) => todo.id !== id));
  }

  // Toggle - map rebuilds the list, swapping done on the one that matched.
  function handleToggle(id) {
    setTodos(
      todos.map((todo) => (todo.id === id ? { ...todo, done: !todo.done } : todo)),
    );
  }

  const doneCount = todos.filter((todo) => todo.done).length;

  return (
    <section>
      <h2>To-Do</h2>
      <p className={styles.intro}>
        Add a task, tick it off, delete it. The whole list is React state - refresh
        the page and it starts over.
      </p>

      <TodoForm onAdd={handleAdd} />

      <TodoList todos={todos} onToggle={handleToggle} onDelete={handleDelete} />

      {todos.length > 0 && (
        <p className={styles.count}>
          {doneCount} of {todos.length} done
        </p>
      )}
    </section>
  );
}

export default Todos;
