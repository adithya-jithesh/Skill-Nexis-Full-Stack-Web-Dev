// The four counts across the top. They come from /api/tasks/stats, which
// counts in MongoDB - the list on screen is filtered, so counting that
// instead would give the wrong totals the moment a filter is on.
function Stats({ stats }) {
  const items = [
    { label: "Total", value: stats.total },
    { label: "Active", value: stats.active },
    { label: "Done", value: stats.completed },
    { label: "High priority", value: stats.high },
  ];

  const percent = stats.total ? Math.round((stats.completed / stats.total) * 100) : 0;

  return (
    <section className="stats">
      <div className="stats__row">
        {items.map((item) => (
          <div key={item.label} className="stats__item">
            <span className="stats__value">{item.value}</span>
            <span className="stats__label">{item.label}</span>
          </div>
        ))}
      </div>

      <div className="stats__bar" role="progressbar" aria-valuenow={percent} aria-valuemin="0" aria-valuemax="100">
        <div className="stats__fill" style={{ width: percent + "%" }} />
      </div>
      <p className="stats__caption">{percent}% done</p>
    </section>
  );
}

export default Stats;
