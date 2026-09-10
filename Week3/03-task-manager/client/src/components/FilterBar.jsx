// The filters. Nothing is stored here: the board keeps them in the URL, and
// this component only reads them and reports changes back.
const STATUSES = [
  { value: "", label: "All" },
  { value: "todo", label: "To do" },
  { value: "doing", label: "Doing" },
  { value: "done", label: "Done" },
];

const DUE = [
  { value: "", label: "Any time" },
  { value: "overdue", label: "Overdue" },
  { value: "today", label: "Due today" },
  { value: "week", label: "Next 7 days" },
  { value: "none", label: "No due date" },
];

const SORTS = [
  { value: "created", label: "Newest" },
  { value: "due", label: "Due date" },
  { value: "title", label: "Title" },
  { value: "updated", label: "Recently changed" },
];

function FilterBar({ filters, tags, onChange, onClear, filtering }) {
  // Every control goes through here, so changing any one of them also sends
  // the list back to page 1 - staying on page 3 of a list that now has one
  // page would show nothing.
  const set = (patch) => onChange({ ...filters, ...patch, page: 1 });

  return (
    <div className="filters">
      <div className="filters__row">
        <input
          type="search"
          className="field__input filters__search"
          placeholder="Search titles, descriptions and tags"
          value={filters.search}
          onChange={(event) => set({ search: event.target.value })}
          aria-label="Search tasks"
        />

        <select
          className="field__input"
          value={filters.sort}
          onChange={(event) => set({ sort: event.target.value })}
          aria-label="Sort by"
        >
          {SORTS.map((sort) => (
            <option key={sort.value} value={sort.value}>
              {sort.label}
            </option>
          ))}
        </select>
      </div>

      <div className="filters__row">
        <div className="chips" role="group" aria-label="Status">
          {STATUSES.map((status) => (
            <button
              key={status.label}
              type="button"
              className={"chip" + (filters.status === status.value ? " chip--on" : "")}
              onClick={() => set({ status: status.value })}
            >
              {status.label}
            </button>
          ))}
        </div>

        <select
          className="field__input"
          value={filters.priority}
          onChange={(event) => set({ priority: event.target.value })}
          aria-label="Priority"
        >
          <option value="">Any priority</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>

        <select
          className="field__input"
          value={filters.due}
          onChange={(event) => set({ due: event.target.value })}
          aria-label="Due"
        >
          {DUE.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {filtering && (
          <button type="button" className="btn btn--ghost btn--small" onClick={onClear}>
            Clear filters
          </button>
        )}
      </div>

      {/* The tags this account has actually used, counted by the API. */}
      {tags.length > 0 && (
        <div className="chips chips--tags">
          {tags.map(({ tag, count }) => (
            <button
              key={tag}
              type="button"
              className={"chip chip--tag" + (filters.tag === tag ? " chip--on" : "")}
              // Clicking the tag that is already on turns it off.
              onClick={() => set({ tag: filters.tag === tag ? "" : tag })}
            >
              {tag} <span className="chip__count">{count}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default FilterBar;
