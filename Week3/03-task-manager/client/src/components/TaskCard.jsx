import { Link } from "react-router-dom";

const NEXT_STATUS = { todo: "doing", doing: "done", done: "todo" };
const STATUS_LABEL = { todo: "To do", doing: "Doing", done: "Done" };

// Says something useful about the date rather than only printing it.
function dueLabel(task) {
  if (!task.dueDate) return null;

  const due = new Date(task.dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Whole days apart, so a task due today is not overdue at 00:01.
  const days = Math.round((due - today) / 86400000);

  if (task.status !== "done" && days < 0) {
    return { text: days === -1 ? "Yesterday" : Math.abs(days) + " days ago", overdue: true };
  }

  if (days === 0) return { text: "Today", soon: true };
  if (days === 1) return { text: "Tomorrow", soon: true };

  return {
    text: due.toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
  };
}

function TaskCard({ task, onAdvance, onDelete }) {
  const due = dueLabel(task);

  return (
    <article className={"task task--" + task.status}>
      <div className="task__head">
        <Link to={"/board/" + task._id} className="task__title">
          {task.title}
        </Link>

        <span className={"badge badge--" + task.priority}>{task.priority}</span>
      </div>

      {task.description && <p className="task__description">{task.description}</p>}

      {task.tags.length > 0 && (
        <div className="task__tags">
          {task.tags.map((tag) => (
            <span key={tag} className="tag">
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="task__foot">
        {/* One click moves a task along todo -> doing -> done -> todo. The
            board does this constantly, so it gets its own small endpoint
            rather than sending the whole task back. */}
        <button
          type="button"
          className={"status-button status-button--" + task.status}
          onClick={() => onAdvance(task, NEXT_STATUS[task.status])}
          title={"Move to " + STATUS_LABEL[NEXT_STATUS[task.status]]}
        >
          {STATUS_LABEL[task.status]}
        </button>

        {due && (
          <span
            className={
              "task__due" +
              (due.overdue ? " task__due--overdue" : "") +
              (due.soon ? " task__due--soon" : "")
            }
          >
            {due.overdue ? "Overdue - " : "Due "}
            {due.text}
          </span>
        )}

        <button
          type="button"
          className="btn btn--danger btn--small task__delete"
          onClick={() => onDelete(task._id)}
        >
          Delete
        </button>
      </div>
    </article>
  );
}

export default TaskCard;
