import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../api";
import FilterBar from "../components/FilterBar";
import Pagination from "../components/Pagination";
import Stats from "../components/Stats";
import TaskCard from "../components/TaskCard";
import TaskForm from "../components/TaskForm";
import { useAuth } from "../context/AuthContext";

const DEFAULTS = { status: "", priority: "", tag: "", due: "", search: "", sort: "created", page: 1 };
const EMPTY_STATS = { total: 0, todo: 0, doing: 0, done: 0, overdue: 0, dueToday: 0 };

function Board() {
  const { user } = useAuth();

  // The filters live in the URL rather than in state. That makes a filtered
  // board a link: it can be bookmarked, shared and reloaded, and the back
  // button steps through the filters instead of leaving the page.
  const [params, setParams] = useSearchParams();

  const filters = {
    status: params.get("status") || "",
    priority: params.get("priority") || "",
    tag: params.get("tag") || "",
    due: params.get("due") || "",
    search: params.get("search") || "",
    sort: params.get("sort") || "created",
    page: Number(params.get("page")) || 1,
  };

  const [tasks, setTasks] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, pages: 1 });
  const [stats, setStats] = useState(EMPTY_STATS);
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [failure, setFailure] = useState("");
  const [notice, setNotice] = useState("");

  // The search box updates the URL on every keystroke, so the request waits
  // for the typing to stop. Everything else changes one click at a time and
  // the same delay costs nothing.
  const query = params.toString();
  const [applied, setApplied] = useState(query);

  useEffect(() => {
    const timer = setTimeout(() => setApplied(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  function writeFilters(next) {
    const clean = {};

    // Defaults are left out of the URL, so a board with nothing filtered has
    // a clean address rather than a string of empty parameters.
    for (const [key, value] of Object.entries(next)) {
      if (value && String(value) !== String(DEFAULTS[key])) clean[key] = String(value);
    }

    setParams(clean);
  }

  const load = useCallback(async () => {
    setLoading(true);
    setFailure("");

    try {
      // The three requests are independent, so they go out together.
      const [taskResult, statsResult, tagResult] = await Promise.all([
        api.getTasks(Object.fromEntries(new URLSearchParams(applied))),
        api.getStats(),
        api.getTags(),
      ]);

      setTasks(taskResult.data);
      setMeta({ total: taskResult.total, page: taskResult.page, pages: taskResult.pages });
      setStats(statsResult.data);
      setTags(tagResult.data);
    } catch (error) {
      // A 401 has already logged out through the axios interceptor, and the
      // route guard takes it from there.
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

  async function handleAdvance(task, status) {
    try {
      await api.setStatus(task._id, status);
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

  const filtering = Boolean(
    filters.status || filters.priority || filters.tag || filters.due || filters.search
  );

  return (
    <>
      <div className="page-head">
        <h1>{user?.name?.split(" ")[0]}&rsquo;s board</h1>
        <p className="muted">
          {stats.overdue > 0
            ? stats.overdue + (stats.overdue === 1 ? " task is overdue." : " tasks are overdue.")
            : stats.total === 0
              ? "Nothing here yet."
              : stats.todo + stats.doing + " still open."}
        </p>
      </div>

      <Stats stats={stats} filters={filters} onPick={(patch) => writeFilters({ ...filters, ...patch, page: 1 })} />

      {failure && <p className="alert alert--error">{failure}</p>}

      {notice && (
        <p className="alert alert--ok">
          {notice}
          <button
            type="button"
            className="alert__close"
            aria-label="Dismiss"
            onClick={() => setNotice("")}
          >
            &times;
          </button>
        </p>
      )}

      <div className="layout">
        <aside className="layout__side">
          <div className="card">
            <h2>New task</h2>
            <TaskForm onSubmit={handleCreate} compact />
          </div>
        </aside>

        <div className="layout__main">
          <FilterBar
            filters={filters}
            tags={tags}
            filtering={filtering}
            onChange={writeFilters}
            onClear={() => setParams({})}
          />

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
                  ? "Try a different filter, or clear them all."
                  : "Add your first one with the form on the left."}
              </p>
            </div>
          )}

          {!loading && tasks.length > 0 && (
            <>
              <div className="task-list">
                {tasks.map((task) => (
                  <TaskCard
                    key={task._id}
                    task={task}
                    onAdvance={handleAdvance}
                    onDelete={handleDelete}
                  />
                ))}
              </div>

              <Pagination
                page={meta.page}
                pages={meta.pages}
                total={meta.total}
                onChange={(page) => writeFilters({ ...filters, page })}
              />
            </>
          )}
        </div>
      </div>
    </>
  );
}

export default Board;
