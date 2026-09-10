// The filter bar. It holds no state of its own: the dashboard owns the
// filters, because it is the one that has to turn them into a request.
function TaskFilters({ filters, onChange, onClear }) {
  const statuses = [
    { value: "", label: "All" },
    { value: "false", label: "Active" },
    { value: "true", label: "Done" },
  ];

  const priorities = ["", "high", "medium", "low"];
  const filtering = Boolean(filters.completed || filters.priority || filters.search);

  return (
    <div className="filters">
      <input
        type="search"
        className="field__input filters__search"
        placeholder="Search titles and descriptions"
        value={filters.search}
        onChange={(event) => onChange({ ...filters, search: event.target.value })}
        aria-label="Search tasks"
      />

      <div className="filters__group" role="group" aria-label="Status">
        {statuses.map((status) => (
          <button
            key={status.label}
            type="button"
            className={"chip" + (filters.completed === status.value ? " chip--on" : "")}
            onClick={() => onChange({ ...filters, completed: status.value })}
          >
            {status.label}
          </button>
        ))}
      </div>

      <select
        className="field__input filters__select"
        value={filters.priority}
        onChange={(event) => onChange({ ...filters, priority: event.target.value })}
        aria-label="Priority"
      >
        {priorities.map((priority) => (
          <option key={priority || "any"} value={priority}>
            {priority ? priority[0].toUpperCase() + priority.slice(1) : "Any priority"}
          </option>
        ))}
      </select>

      {filtering && (
        <button type="button" className="btn btn--ghost btn--small" onClick={onClear}>
          Clear
        </button>
      )}
    </div>
  );
}

export default TaskFilters;
