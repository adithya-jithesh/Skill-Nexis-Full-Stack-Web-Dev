// Sidebar - the search box and the tag list.
// Props: search, onSearchChange, tags, activeTag, onTagChange, onClearFilters.
// It owns no state. The tags come from the API (/api/notes/tags), which counts
// how often the logged-in user has used each one.

function Sidebar({ search, onSearchChange, tags, activeTag, onTagChange, onClearFilters }) {
  return (
    <div className="sidebar">
      <h2>Search</h2>

      <div className="search-field">
        {/* controlled input: its value comes from App's state */}
        <input
          type="text"
          placeholder="Search your notes"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
        />

        {/* the little x only appears when there is something to clear */}
        {search && (
          <button
            type="button"
            className="search-field__clear"
            aria-label="Clear search"
            onClick={() => onSearchChange("")}
          >
            &times;
          </button>
        )}
      </div>
      <p className="hint">Matches the title, the text and the tags.</p>

      <div className="sidebar__section">
        <h2>Tags</h2>

        {tags.length === 0 ? (
          <p className="hint">No tags yet. Add some when you write a note.</p>
        ) : (
          <ul className="tag-list">
            {tags.map((tag) => (
              <li key={tag.tag}>
                <button
                  type="button"
                  className={tag.tag === activeTag ? "tag-btn tag-btn-active" : "tag-btn"}
                  // clicking the tag that is already on turns it off
                  onClick={() => onTagChange(tag.tag === activeTag ? "" : tag.tag)}
                >
                  #{tag.tag}
                  <span className="tag-btn__count">{tag.count}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* nothing to clear when nothing is filtered */}
      {(search || activeTag) && (
        <div className="sidebar__section">
          <button type="button" className="btn btn-block" onClick={onClearFilters}>
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}

export default Sidebar;
