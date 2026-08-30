import Button from "./Button";

// Sidebar - the search box and the category list.
// Props: search, onSearchChange, categories, activeCategory,
//        onCategoryChange, onClearFilters.
// It owns no state. It shows what App gives it and calls App's functions
// when something is typed or clicked.

function Sidebar({
  search,
  onSearchChange,
  categories,
  activeCategory,
  onCategoryChange,
  onClearFilters,
}) {
  return (
    <div className="sidebar">
      <h2>Search</h2>
      {/* controlled input: the value comes from App's state */}
      <input
        type="text"
        placeholder="Search posts"
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
      />

      <h2>Categories</h2>
      <ul className="category-list">
        {categories.map((category) => (
          <li key={category}>
            {/* the selected category gets an extra class */}
            <button
              type="button"
              className={
                category === activeCategory
                  ? "category-btn category-btn-active"
                  : "category-btn"
              }
              onClick={() => onCategoryChange(category)}
            >
              {category}
            </button>
          </li>
        ))}
      </ul>

      <Button onClick={onClearFilters}>Clear filters</Button>
    </div>
  );
}

export default Sidebar;
