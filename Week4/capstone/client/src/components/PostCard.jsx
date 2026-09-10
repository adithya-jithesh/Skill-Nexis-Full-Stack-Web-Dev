import { useState } from "react";
import { Link } from "react-router-dom";
import { api, fileUrl } from "../api";
import Avatar from "./Avatar";
import { useAuth } from "../context/AuthContext";
import { timeAgo } from "../timeAgo";

// One post, as it appears in a feed and at the top of its own page.
//
// onChange hands the updated post back to whichever list is holding it, so the
// list stays the owner of its data and this component does not have to know
// whether it is on a feed, a profile or a thread.
function PostCard({ post, onChange, onDeleted, showThreadLink = true }) {
  const { user, isLoggedIn } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const mine = user && post.author && user.id === post.author.id;

  async function handleLike() {
    if (!isLoggedIn || busy) return;

    // Optimistic: the heart fills the moment it is tapped, because waiting for
    // a round trip to acknowledge a like feels broken. The previous state is
    // kept so the change can be undone if the server disagrees.
    const previous = { likedByMe: post.likedByMe, likeCount: post.likeCount };

    onChange({
      ...post,
      likedByMe: !post.likedByMe,
      likeCount: post.likeCount + (post.likedByMe ? -1 : 1),
    });

    setBusy(true);

    try {
      // The server's count is the real one - two people liking at once means
      // the guess above was low.
      const result = await api.toggleLike(post.id);
      onChange({ ...post, likedByMe: result.data.liked, likeCount: result.data.likeCount });
    } catch (likeError) {
      onChange({ ...post, ...previous });
      setError(likeError.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    setBusy(true);

    try {
      await api.deletePost(post.id);
      onDeleted(post.id);
    } catch (deleteError) {
      setError(deleteError.message);
      setBusy(false);
    }
  }

  return (
    <article className="post">
      <Avatar user={post.author} size={44} />

      <div className="post__body">
        <div className="post__head">
          <Link to={"/u/" + post.author?.username} className="post__name">
            {post.author?.name}
          </Link>
          <span className="post__handle">@{post.author?.username}</span>
          <span className="post__dot">&middot;</span>
          {/* The full timestamp on hover, the short form on screen. */}
          <time className="post__time" dateTime={post.createdAt} title={new Date(post.createdAt).toLocaleString("en-GB")}>
            {timeAgo(post.createdAt)}
          </time>

          {mine && (
            <button
              type="button"
              className="post__delete"
              onClick={handleDelete}
              disabled={busy}
              aria-label="Delete post"
            >
              Delete
            </button>
          )}
        </div>

        {/* white-space: pre-wrap in the stylesheet, so the line breaks someone
            typed are the line breaks they get. */}
        <p className="post__text">{post.text}</p>

        {post.imageUrl && (
          <a href={fileUrl(post.imageUrl)} target="_blank" rel="noreferrer" className="post__image">
            <img src={fileUrl(post.imageUrl)} alt="" loading="lazy" />
          </a>
        )}

        {error && <p className="post__error">{error}</p>}

        <div className="post__actions">
          <button
            type="button"
            className={"like" + (post.likedByMe ? " like--on" : "")}
            onClick={handleLike}
            disabled={!isLoggedIn}
            title={isLoggedIn ? "" : "Log in to like posts"}
            aria-pressed={post.likedByMe}
          >
            <span aria-hidden="true">{post.likedByMe ? "♥" : "♡"}</span>
            {post.likeCount}
          </button>

          {showThreadLink ? (
            <Link to={"/p/" + post.id} className="post__action">
              <span aria-hidden="true">💬</span> {post.commentCount}
            </Link>
          ) : (
            <span className="post__action post__action--flat">
              <span aria-hidden="true">💬</span> {post.commentCount}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}

export default PostCard;
