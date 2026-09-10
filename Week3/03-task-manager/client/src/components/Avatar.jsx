import { fileUrl } from "../api";

// The uploaded picture if there is one, and the user's initials drawn in a
// circle if there is not - so an account with no avatar still looks finished
// rather than showing a broken image.
function Avatar({ user, size = 32 }) {
  const initials = (user?.name || "?")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");

  const style = { width: size, height: size, fontSize: Math.round(size / 2.6) };

  if (user?.avatarUrl) {
    return <img className="avatar" style={style} src={fileUrl(user.avatarUrl)} alt="" />;
  }

  return (
    <span className="avatar avatar--initials" style={style}>
      {initials}
    </span>
  );
}

export default Avatar;
