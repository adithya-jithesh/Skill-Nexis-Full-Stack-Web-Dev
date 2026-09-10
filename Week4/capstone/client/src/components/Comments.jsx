import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import Avatar from "./Avatar";
import { useAuth } from "../context/AuthContext";
import { timeAgo } from "../timeAgo";

const MAX_TEXT = 280;

// The thread under a post: the comments, and the box to add one.
//
// postAuthorId is passed in because the delete button follows the server's
// rule - your own comment, or any comment on your own post.
function Comments({ postId, postAuthorId, comments, onChange, onCountChange }) {
  const { user, isLoggedIn } = useAuth();

  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    if (!text.trim()) return;

    setBusy(true);
    setError("");

    try {
      const result = await api.createComment(postId, text.trim());
      // Appended rather than refetching the thread: the server just told us
      // exactly what was added.
      onChange([...comments, result.data]);
      onCountChange(1);
      setText("");
    } catch (commentError) {
      setError(commentError.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(id) {
    try {
      await api.deleteComment(id);
      onChange(comments.filter((comment) => comment.id !== id));
      onCountChange(-1);
    } catch (deleteError) {
      setError(deleteError.message);
    }
  }

  return (
    <section className="thread">
      <h2 className="thread__title">
        {comments.length === 0
          ? "No replies yet"
          : comments.length + (comments.length === 1 ? " reply" : " replies")}
      </h2>

      {isLoggedIn ? (
        <form className="reply" onSubmit={handleSubmit}>
          <Avatar user={user} size={36} linked={false} />

          <input
            className="field__input"
            value={text}
            maxLength={MAX_TEXT}
            onChange={(event) => setText(event.target.value)}
            placeholder="Write a reply"
            aria-label="Write a reply"
          />

          <button type="submit" className="btn btn--primary btn--small" disabled={busy || !text.trim()}>
            Reply
          </button>
        </form>
      ) : (
        <p className="muted">
          <Link to="/login">Log in</Link> to join the conversation.
        </p>
      )}

      {error && <p className="alert alert--error">{error}</p>}

      <ul className="comments">
        {comments.map((comment) => {
          // The same rule the server enforces, so the button only appears when
          // pressing it would actually work.
          const canDelete =
            user && (user.id === comment.author?.id || user.id === postAuthorId);

          return (
            <li key={comment.id} className="comment">
              <Avatar user={comment.author} size={32} />

              <div className="comment__body">
                <div className="comment__head">
                  <Link to={"/u/" + comment.author?.username} className="comment__name">
                    {comment.author?.name}
                  </Link>
                  <span className="comment__handle">@{comment.author?.username}</span>
                  <span className="post__dot">&middot;</span>
                  <time dateTime={comment.createdAt}>{timeAgo(comment.createdAt)}</time>

                  {canDelete && (
                    <button
                      type="button"
                      className="comment__delete"
                      onClick={() => handleDelete(comment.id)}
                      aria-label="Delete reply"
                    >
                      &times;
                    </button>
                  )}
                </div>

                <p className="comment__text">{comment.text}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export default Comments;
