import { Link } from "react-router-dom";
import { fileUrl } from "../api";

// The uploaded picture if there is one, initials in a circle if not - so an
// account with no avatar still looks finished rather than showing a broken
// image. Wrapped in a link to the profile unless told otherwise, since that
// is what a face means on a feed.
function Avatar({ user, size = 40, linked = true }) {
  const initials = (user?.name || "?")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");

  const style = { width: size, height: size, fontSize: Math.round(size / 2.5) };

  const face = user?.avatarUrl ? (
    <img className="avatar" style={style} src={fileUrl(user.avatarUrl)} alt="" />
  ) : (
    <span className="avatar avatar--initials" style={style}>
      {initials}
    </span>
  );

  if (!linked || !user?.username) return face;

  return (
    <Link to={"/u/" + user.username} className="avatar-link">
      {face}
    </Link>
  );
}

export default Avatar;
