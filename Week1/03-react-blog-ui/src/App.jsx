import { useState } from "react";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import PostCard from "./components/PostCard";
import Footer from "./components/Footer";

// The posts come from a local JSON file. Vite bundles the file, so this
// import gives us a normal JavaScript array straight away - no fetch needed.
import posts from "./data/posts.json";

const footerLinks = [
  { label: "GitHub", href: "https://github.com/adithya-jithesh" },
  { label: "LinkedIn", href: "https://linkedin.com/in/adithyajithesh" },
];

function App() {
  // State: what is typed in the search box, and which category is selected.
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  // The category buttons are built from the posts themselves.
  // A Set removes the duplicates, then the spread turns it back into an array.
  const categories = ["All", ...new Set(posts.map((post) => post.category))];

  // Calculated on every render from posts + search + category,
  // so it can never disagree with them. It is not state.
  const shownPosts = posts.filter((post) => {
    const text = post.title + " " + post.summary + " " + post.tags.join(" ");
    const matchesSearch = text.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === "All" || post.category === category;
    return matchesSearch && matchesCategory;
  });

  function handleClearFilters() {
    setSearch("");
    setCategory("All");
  }

  return (
    <div className="app">
      <Header
        title="Learning Full Stack"
        subtitle="Notes I write down while working through the SkillNexis MERN internship."
        postCount={shownPosts.length}
        totalCount={posts.length}
      />

      {/* two columns: filters on the left, the posts on the right */}
      <div className="layout">
        <div className="left-column">
          <Sidebar
            search={search}
            onSearchChange={setSearch}
            categories={categories}
            activeCategory={category}
            onCategoryChange={setCategory}
            onClearFilters={handleClearFilters}
          />
        </div>

        <div className="right-column">
          {/* if nothing matches, show a message instead of the list */}
          {shownPosts.length === 0 && (
            <p className="no-results">No posts found. Try another search.</p>
          )}

          {shownPosts.map((post) => (
            <PostCard
              key={post.id}
              title={post.title}
              author={post.author}
              date={post.date}
              category={post.category}
              tags={post.tags}
              summary={post.summary}
              content={post.content}
            />
          ))}
        </div>
      </div>

      <Footer name="Adithya Jithesh" links={footerLinks} />
    </div>
  );
}

export default App;
