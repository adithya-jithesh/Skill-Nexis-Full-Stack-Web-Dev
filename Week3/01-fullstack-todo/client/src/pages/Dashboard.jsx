import { useCallback, useEffect, useState } from "react";
import { api } from "../api";
import Stats from "../components/Stats";
import TaskCard from "../components/TaskCard";
import TaskFilters from "../components/TaskFilters";
import TaskForm from "../components/TaskForm";
import { useAuth } from "../context/AuthContext";

const emptyFilters = { completed: "", priority: "", search: "" };
const emptyStats = { total: 0, active: 0, completed: 0, high: 0 };

function Dashboard() {
  const { user } = useAuth();

  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState(emptyStats);
  const [filters, setFilters] = useState(emptyFilters);
  // What actually goes to the API. It trails the typed search by a moment,
  // so a five letter word is one request rather than five.
  const [applied, setApplied] = useState(emptyFilters);
  const [loading, setLoading] = useState(true);
  const [failure, setFailure] = useState("");
  const [notice, setNotice] = useState("");

  // Wait until the typing stops before searching. The status and priority
  // filters go through the same delay, which costs nothing - they change one
  // click at a time.
  useEffect(() => {
    const timer = setTimeout(() => setApplied(filters), 300);
    return () => clearTimeout(timer);
  }, [filters]);

  const load = useCallback(async () => {
    setLoading(true);
    setFailure("");

    try {
      // Neither call needs the other's answer, so they go out together.
      const [taskResult, statsResult] = await Promise.all([api.getTasks(applied), api.getStats()]);
      setTasks(taskResult.data);
      setStats(statsResult.data);
    } catch (error) {
      // A 401 has already logged out through the axios interceptor, and the
      // route guard will take it from there.
      if (error.status !== 401) setFailure(error.message);
    } finally {
      setLoading(false);
    }
  }, [applied]);

  useEffect(() => {
    load();
  }, [load]);

  // Returns a message on failure and nothing on success - TaskForm reads
  // that to decide whether to clear itself.
  async function handleCreate(task) {
    try {
      await api.createTask(task);
      await load();
      setNotice("Task added.");
    } catch (error) {
      return error.message;
    }
  }

  async function handleToggle(id) {
    try {
      await api.toggleTask(id);
      await load();
    } catch (error) {
      setFailure(error.message);
    }
  }

  async function handleDelete(id) {
    try {
      await api.deleteTask(id);
      await load();
      setNotice("Task deleted.");
    } catch (error) {
      setFailure(error.message);
    }
  }

  const filtering = Boolean(applied.completed || applied.priority || applied.search);

  return (
    <>
      <div className="page-head">
        <h1>Hello, {user?.name?.split(" ")[0]}</h1>
        <p className="muted">
          {stats.active === 0 ? "Nothing left to do." : stats.active + " still to do."}
        </p>
      </div>

      <Stats stats={stats} />

      {failure && <p className="alert alert--error">{failure}</p>}

      {notice && (
        <p className="alert alert--ok">
          {notice}
          <button type="button" className="alert__close" aria-label="Dismiss" onClick={() => setNotice("")}>
            &times;
          </button>
        </p>
      )}

      <div className="layout">
        <div className="layout__side">
          <div className="card">
            <h2>New task</h2>
            <TaskForm onSubmit={handleCreate} />
          </div>
        </div>

        <div className="layout__main">
          <TaskFilters filters={filters} onChange={setFilters} onClear={() => setFilters(emptyFilters)} />

          {/* Grey placeholders while the request is in flight, so the page
              does not jump when the tasks arrive. */}
          {loading && (
            <div className="task-list">
              <div className="skeleton" />
              <div className="skeleton" />
              <div className="skeleton" />
            </div>
          )}

          {!loading && tasks.length === 0 && (
            <div className="empty">
              <p className="empty__title">{filtering ? "Nothing matches that" : "No tasks yet"}</p>
              <p>
                {filtering
                  ? "Try a different search, or clear the filters."
                  : "Add your first one with the form on the left."}
              </p>
            </div>
          )}

          {!loading && tasks.length > 0 && (
            <>
              <p className="muted list-count">
                {filtering ? "Showing " + tasks.length + " of " + stats.total : tasks.length + " tasks"}
              </p>

              <div className="task-list">
                {tasks.map((task) => (
                  <TaskCard
                    key={task._id}
                    task={task}
                    onToggle={handleToggle}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

export default Dashboard;
