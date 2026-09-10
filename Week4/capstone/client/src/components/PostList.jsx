import { useCallback, useEffect, useState } from "react";
import { api } from "../api";
import PostCard from "./PostCard";
import { useRealtimeEvent } from "../context/RealtimeContext";

// A list of posts that loads itself, pages itself, and hands each card a way
// to report changes back. The feed, a profile and the people page all show
// posts; only the query differs, so it is passed in.
//
// `reload` is a value the parent changes when something outside this list
// should force a refetch - a new post of your own, or switching tabs.
function PostList({ query, emptyTitle, emptyBody, reload = 0 }) {
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  // Posts that arrived over the socket while this list was on screen. They are
  // held back rather than inserted, because a feed that moves under your thumb
  // while you are reading it is infuriating - the pill lets you choose.
  const [pending, setPending] = useState([]);

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
        if (which === 1) setPending([]);
      } catch (loadError) {
        if (loadError.status !== 401) setError(loadError.message);
      } finally {
        setLoading(false);
      }
    },
    [key]
  );

  useEffect(() => {
    load(1);
  }, [load, reload]);

  // Does a post announced over the socket belong in *this* list? The server
  // sends the feed events to the right people, but one client can be showing a
  // profile or the public timeline instead, and those are different questions.
  const belongsHere = useCallback(
    (payload) => {
      const filters = JSON.parse(key);

      if (filters.username) return payload.post.author?.username === filters.username;
      if (filters.scope === "following") return payload.scope === "following";
      return payload.scope === "everyone";
    },
    [key]
  );

  useRealtimeEvent("post:new", (payload) => {
    if (!belongsHere(payload)) return;

    setPending((current) => {
      // A reconnect can replay an event, and your own post is already at the
      // top from the response that created it.
      if (current.some((post) => post.id === payload.post.id)) return current;
      return [payload.post, ...current];
    });
  });

  // Somebody else liked or replied. Only the counts are replaced - likedByMe
  // is this viewer's own state and the event does not carry it.
  useRealtimeEvent("post:counts", (payload) => {
    const apply = (post) =>
      post.id === payload.id
        ? { ...post, likeCount: payload.likeCount, commentCount: payload.commentCount }
        : post;

    setPosts((current) => current.map(apply));
    setPending((current) => current.map(apply));
  });

  useRealtimeEvent("post:deleted", (payload) => {
    setPosts((current) => current.filter((post) => post.id !== payload.id));
    setPending((current) => current.filter((post) => post.id !== payload.id));
  });

  function showPending() {
    setPosts((current) => {
      const known = new Set(current.map((post) => post.id));
      return [...pending.filter((post) => !known.has(post.id)), ...current];
    });
    setPending([]);
  }

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

  return (
    <>
      {pending.length > 0 && (
        <button type="button" className="new-posts" onClick={showPending}>
          {pending.length === 1 ? "1 new post" : pending.length + " new posts"} &uarr;
        </button>
      )}

      {posts.length === 0 ? (
        <div className="empty">
          <p className="empty__title">{emptyTitle}</p>
          <p>{emptyBody}</p>
        </div>
      ) : (
        <>
          <div className="feed">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onChange={handleChange}
                onDeleted={handleDeleted}
              />
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
      )}
    </>
  );
}

export default PostList;
