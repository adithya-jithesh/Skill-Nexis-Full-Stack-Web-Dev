// The row of counts. They come from /api/tasks/stats, which counts in
// MongoDB - the list on screen is filtered and paginated, so counting that
// would be wrong twice over.
//
// Each tile is a button: clicking one applies the filter it describes, which
// is the quickest route from "3 overdue" to seeing which three.
function Stats({ stats, filters, onPick }) {
  const tiles = [
    { key: "total", label: "Total", value: stats.total, patch: { status: "", due: "" } },
    { key: "todo", label: "To do", value: stats.todo, patch: { status: "todo", due: "" } },
    { key: "doing", label: "Doing", value: stats.doing, patch: { status: "doing", due: "" } },
    { key: "done", label: "Done", value: stats.done, patch: { status: "done", due: "" } },
    {
      key: "overdue",
      label: "Overdue",
      value: stats.overdue,
      patch: { status: "", due: "overdue" },
      alert: stats.overdue > 0,
    },
    {
      key: "dueToday",
      label: "Due today",
      value: stats.dueToday,
      patch: { status: "", due: "today" },
    },
  ];

  const done = stats.total ? Math.round((stats.done / stats.total) * 100) : 0;

  return (
    <section className="stats">
      <div className="stats__row">
        {tiles.map((tile) => {
          // Highlighted when the board is currently showing exactly what
          // this tile counts.
          const active =
            filters.status === tile.patch.status && filters.due === tile.patch.due;

          return (
            <button
              key={tile.key}
              type="button"
              className={
                "stat" + (active ? " stat--on" : "") + (tile.alert ? " stat--alert" : "")
              }
              onClick={() => onPick(tile.patch)}
            >
              <span className="stat__value">{tile.value}</span>
              <span className="stat__label">{tile.label}</span>
            </button>
          );
        })}
      </div>

      <div
        className="stats__bar"
        role="progressbar"
        aria-valuenow={done}
        aria-valuemin="0"
        aria-valuemax="100"
        aria-label="Finished"
      >
        <div className="stats__fill" style={{ width: done + "%" }} />
      </div>
      <p className="stats__caption">{done}% finished</p>
    </section>
  );
}

export default Stats;
