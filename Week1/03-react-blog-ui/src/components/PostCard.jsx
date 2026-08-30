import { useState } from "react";
import Button from "./Button";

// PostCard - one blog post. Rendered once for every post in the list.
// Props: title, author, date, category, tags, summary, content.
// This component has its own small piece of state: whether the full post
// is open or not. It only affects this one card, so App does not need it.

function PostCard({ title, author, date, category, tags, summary, content }) {
  const [open, setOpen] = useState(false);

  // "2026-08-04" is easier to read as "4 Aug 2026"
  const readableDate = new Date(date).toDateString().slice(4);

  return (
    <article className="post">
      <span className="post__category">{category}</span>
      <h3>{title}</h3>
      <p className="post__meta">
        By {author} on {readableDate}
      </p>

      <p>{summary}</p>

      {/* the full text is only rendered when open is true */}
      {open && <p className="post__content">{content}</p>}

      <ul className="post__tags">
        {tags.map((tag) => (
          <li key={tag}>#{tag}</li>
        ))}
      </ul>

      <Button onClick={() => setOpen(!open)}>
        {open ? "Show less" : "Read more"}
      </Button>
    </article>
  );
}

export default PostCard;
