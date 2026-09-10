import { useCallback, useEffect, useState } from "react";
import { api } from "../api";
import PostCard from "./PostCard";

// A list of posts that loads itself, pages itself, and hands each card a way
// to report changes back. The feed, a profile and the people page all show
// posts; only the query differs, so it is passed in.
//
// `reload` is a value the parent changes when something outside this list
// should force a refetch - a new post, or switching tabs.
function PostList({ query, emptyTitle, emptyBody, reload = 0 }) {
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // The query object is rebuilt by the parent on every render, so it cannot be
  // a dependency directly - its contents are what matter, not its identity.
  const key = JSON.stringify(query);

  const load = useCallback(
    async (which) => {
      setLoading(true);
      setError("");

      try {
        const result = await api.getPosts({ ...JSON.parse(key), page: which });

        // Page 1 replaces the list; later pages add to it, which is what makes
        // "Load more" append rather than jump.
        setPosts((current) => (which === 1 ? result.data : [...current, ...result.data]));
        setPage(result.page);
        setPages(result.pages);
      } catch (loadError) {
        if (loadError.status !== 401) setError(loadError.message);
      } finally {
        setLoading(false);
      }
    },
    [key]
  );

  // Back to the top whenever the query changes or the parent asks for a
  // refresh.
  useEffect(() => {
    load(1);
  }, [load, reload]);

  // Handed to each card: swap the one that changed, leave the rest alone.
  function handleChange(updated) {
    setPosts((current) => current.map((post) => (post.id === updated.id ? updated : post)));
  }

  function handleDeleted(id) {
    setPosts((current) => current.filter((post) => post.id !== id));
  }

  if (loading && posts.length === 0) {
    return (
      <div className="feed">
        <div className="skeleton" />
        <div className="skeleton" />
        <div className="skeleton" />
      </div>
    );
  }

  if (error) return <p className="alert alert--error">{error}</p>;

  if (posts.length === 0) {
    return (
      <div className="empty">
        <p className="empty__title">{emptyTitle}</p>
        <p>{emptyBody}</p>
      </div>
    );
  }

  return (
    <>
      <div className="feed">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} onChange={handleChange} onDeleted={handleDeleted} />
        ))}
      </div>

      {page < pages && (
        <button
          type="button"
          className="btn btn--ghost btn--block"
          onClick={() => load(page + 1)}
          disabled={loading}
        >
          {loading ? "Loading..." : "Load more"}
        </button>
      )}
    </>
  );
}

export default PostList;
