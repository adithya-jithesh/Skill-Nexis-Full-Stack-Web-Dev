import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../api";
import Comments from "../components/Comments";
import PostCard from "../components/PostCard";
import { useRealtime, useRealtimeEvent } from "../context/RealtimeContext";

// One post and its thread, on its own URL - which is the point of the route
// parameter: it can be linked to, bookmarked and reloaded.
function PostPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { socket, connected } = useRealtime();

  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setError("");

    // The post and its replies are independent requests, so they go together.
    Promise.all([api.getPost(id), api.getComments(id)])
      .then(([postResult, commentResult]) => {
        if (cancelled) return;
        setPost(postResult.data);
        setComments(commentResult.data);
      })
      .catch((loadError) => {
        if (!cancelled) setError(loadError.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  // Ask the server to send this thread's events for as long as the page is
  // open, and to stop when it is not. Rooms are per socket, so two tabs on two
  // different posts each hear only their own.
  useEffect(() => {
    const current = socket.current;
    if (!current || !connected) return;

    current.emit("post:watch", id);

    return () => current.emit("post:unwatch", id);
  }, [socket, connected, id]);

  useRealtimeEvent("comment:new", (payload) => {
    if (payload.postId !== id) return;

    setComments((current) =>
      // A reply of your own is already here from the response that created it.
      current.some((comment) => comment.id === payload.comment.id)
        ? current
        : [...current, payload.comment]
    );
  });

  useRealtimeEvent("comment:deleted", (payload) => {
    if (payload.postId !== id) return;
    setComments((current) => current.filter((comment) => comment.id !== payload.commentId));
  });

  // Somebody else liked or replied while this page was open.
  useRealtimeEvent("post:counts", (payload) => {
    if (payload.id !== id) return;
    setPost((current) =>
      current
        ? { ...current, likeCount: payload.likeCount, commentCount: payload.commentCount }
        : current
    );
  });

  useRealtimeEvent("post:deleted", (payload) => {
    if (payload.id === id) setError("That post has been deleted.");
  });

  if (loading) return <p className="loading">Loading...</p>;

  if (error || !post) {
    return (
      <div className="card card--form">
        <h1>Not found</h1>
        <p className="alert alert--error">{error || "That post is not here."}</p>
        <Link to="/" className="btn btn--primary">
          Back to the feed
        </Link>
      </div>
    );
  }

  return (
    <div className="columns">
      <div className="columns__main">
        <Link to="/" className="back-link">
          &larr; Back
        </Link>

        <PostCard
          post={post}
          onChange={setPost}
          // Deleting the post you are looking at has nowhere to return to.
          onDeleted={() => navigate("/", { replace: true })}
          showThreadLink={false}
        />

        <Comments
          postId={post.id}
          postAuthorId={post.author?.id}
          comments={comments}
          onChange={setComments}
          // Keeps the count on the card in step with the thread underneath it,
          // without refetching the post.
          onCountChange={(delta) =>
            setPost((current) => ({ ...current, commentCount: current.commentCount + delta }))
          }
        />
      </div>
    </div>
  );
}

export default PostPage;
