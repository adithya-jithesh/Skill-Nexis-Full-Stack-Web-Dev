import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../api";
import TaskForm from "../components/TaskForm";

// One task on its own URL, which is the point of the route parameter: the
// page can be linked to, bookmarked and reloaded and still knows which task
// it is showing.
function TaskDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [failure, setFailure] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let cancelled = false;

    setLoading(true);

    api
      .getTask(id)
      .then((result) => {
        if (!cancelled) setTask(result.data);
      })
      .catch((error) => {
        // Another account's task answers 404 here, exactly as a deleted one
        // would - the API does not say which.
        if (!cancelled && error.status !== 401) setFailure(error.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  async function handleSave(updates) {
    try {
      const result = await api.updateTask(id, updates);
      setTask(result.data);
      setNotice("Saved.");
    } catch (error) {
      return error.message;
    }
  }

  async function handleDelete() {
    try {
      await api.deleteTask(id);
      navigate("/board", { replace: true });
    } catch (error) {
      setFailure(error.message);
    }
  }

  if (loading) return <p className="loading">Loading...</p>;

  if (failure) {
    return (
      <div className="card card--form">
        <h1>Not found</h1>
        <p className="alert alert--error">{failure}</p>
        <Link to="/board" className="btn btn--primary">
          Back to the board
        </Link>
      </div>
    );
  }

  return (
    <div className="card card--form">
      <div className="page-head">
        <h1>Edit task</h1>
        <p className="muted">
          Added {new Date(task.createdAt).toLocaleDateString("en-GB")} &middot; last changed{" "}
          {new Date(task.updatedAt).toLocaleDateString("en-GB")}
        </p>
      </div>

      {notice && <p className="alert alert--ok">{notice}</p>}

      {/* The same form as the board, holding this task's values - editing
          and adding are the same thing with different contents. */}
      <TaskForm task={task} onSubmit={handleSave} submitLabel="Save changes" />

      <div className="detail__actions">
        <Link to="/board" className="btn btn--ghost">
          Back
        </Link>
        <button type="button" className="btn btn--danger" onClick={handleDelete}>
          Delete task
        </button>
      </div>
    </div>
  );
}

export default TaskDetail;
