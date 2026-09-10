import { Link } from "react-router-dom";
import Avatar from "./Avatar";
import FollowButton from "./FollowButton";

// A person in a list: search results, followers, and the "who to follow"
// panel all use this.
function UserCard({ user, onFollowChange }) {
  return (
    <div className="user-card">
      <Avatar user={user} size={40} />

      <div className="user-card__body">
        <Link to={"/u/" + user.username} className="user-card__name">
          {user.name}
        </Link>
        <span className="user-card__handle">@{user.username}</span>
        {user.bio && <p className="user-card__bio">{user.bio}</p>}
      </div>

      {/* onFollowChange is optional: a plain followers list has nothing to
          update, while a search result keeps its own button in step. */}
      {onFollowChange && (
        <FollowButton
          username={user.username}
          followed={user.followedByMe}
          onChange={(data) => onFollowChange(user.username, data)}
          small
        />
      )}
    </div>
  );
}

export default UserCard;
