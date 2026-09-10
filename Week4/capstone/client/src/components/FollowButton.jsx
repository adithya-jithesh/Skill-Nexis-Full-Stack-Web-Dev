import { useState } from "react";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";

// Follow and unfollow are one endpoint that toggles, so this is one button
// that changes what it says. onChange reports the new state back to whichever
// screen is showing it, so a profile can move its follower count.
function FollowButton({ username, followed, onChange, small = false }) {
  const { isLoggedIn, refreshMe } = useAuth();
  const [busy, setBusy] = useState(false);

  if (!isLoggedIn) return null;

  async function handleClick() {
    setBusy(true);

    try {
      const result = await api.toggleFollow(username);
      onChange(result.data);
      // Your own following count just changed.
      refreshMe();
    } catch {
      // Nothing changed server-side, so the button simply stays as it was.
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      className={
        "btn " + (followed ? "btn--ghost" : "btn--primary") + (small ? " btn--small" : "")
      }
      onClick={handleClick}
      disabled={busy}
    >
      {followed ? "Following" : "Follow"}
    </button>
  );
}

export default FollowButton;
