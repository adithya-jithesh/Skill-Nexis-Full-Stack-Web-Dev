// Sidebar - the search box and the tag list.
// Props: search, onSearchChange, tags, activeTag, onTagChange, onClearFilters.
// The tags come from the API (/api/notes/tags), which counts how often the
// logged-in user has used each one.

function Sidebar({ search, onSearchChange, tags, activeTag, onTagChange, onClearFilters }) {
  return (
    <div className="sidebar">
      <h2>Search</h2>
      {/* controlled input: its value comes from App's state */}
      <input
        type="text"
        placeholder="Search your notes"
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
      />
      <p className="hint">Matches the title, the text and the tags.</p>

      <h2>Tags</h2>
      {tags.length === 0 && <p className="hint">No tags yet.</p>}

      <ul className="tag-list">
        {tags.map((tag) => (
          <li key={tag.tag}>
            <button
              type="button"
              className={tag.tag === activeTag ? "tag-btn tag-btn-active" : "tag-btn"}
              onClick={() => onTagChange(tag.tag === activeTag ? "" : tag.tag)}
            >
              #{tag.tag} <span className="tag-btn__count">{tag.count}</span>
            </button>
          </li>
        ))}
      </ul>

      {/* nothing to clear when nothing is filtered */}
      {(search || activeTag) && (
        <button type="button" className="btn" onClick={onClearFilters}>
          Clear filters
        </button>
      )}
    </div>
  );
}

export default Sidebar;
