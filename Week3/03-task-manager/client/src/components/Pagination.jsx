// Paging is done by the API - it returns one page of tasks plus how many
// pages there are, so this only has to move between them.
function Pagination({ page, pages, total, onChange }) {
  if (pages <= 1) return null;

  return (
    <div className="pagination">
      <button
        type="button"
        className="btn btn--ghost btn--small"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
      >
        Previous
      </button>

      <span className="muted">
        Page {page} of {pages} &middot; {total} tasks
      </span>

      <button
        type="button"
        className="btn btn--ghost btn--small"
        disabled={page >= pages}
        onClick={() => onChange(page + 1)}
      >
        Next
      </button>
    </div>
  );
}

export default Pagination;
