import { Link } from "react-router-dom";

// Formats a due date, and says something useful about it rather than just
// printing it: an unfinished task past its date is overdue.
function dueLabel(task) {
  if (!task.dueDate) return null;

  const due = new Date(task.dueDate);
  const text = due.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

  // Compared date to date, so a task due today is not overdue at 00:01.
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const overdue = !task.completed && due < today;

  return { text, overdue };
}

function TaskCard({ task, onToggle, onDelete }) {
  const due = dueLabel(task);

  return (
    <article className={"task" + (task.completed ? " task--done" : "")}>
      {/* The checkbox is the toggle. It is a real input, so it can be
          reached and flipped with the keyboard. */}
      <input
        type="checkbox"
        className="task__check"
        checked={task.completed}
        onChange={() => onToggle(task._id)}
        aria-label={task.completed ? "Mark as not done" : "Mark as done"}
      />

      <div className="task__body">
        <Link to={"/tasks/" + task._id} className="task__title">
          {task.title}
        </Link>

        {task.description && <p className="task__description">{task.description}</p>}

        <div className="task__meta">
          <span className={"badge badge--" + task.priority}>{task.priority}</span>

          {due && (
            <span className={"task__due" + (due.overdue ? " task__due--overdue" : "")}>
              {due.overdue ? "Overdue: " : "Due "}
              {due.text}
            </span>
          )}
        </div>
      </div>

      <button
        type="button"
        className="btn btn--danger btn--small"
        onClick={() => onDelete(task._id)}
      >
        Delete
      </button>
    </article>
  );
}

export default TaskCard;
