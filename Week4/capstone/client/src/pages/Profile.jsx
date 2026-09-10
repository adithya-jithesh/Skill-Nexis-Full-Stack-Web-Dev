import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api";
import Avatar from "../components/Avatar";
import FollowButton from "../components/FollowButton";
import PostList from "../components/PostList";
import UserCard from "../components/UserCard";
import { timeAgo } from "../timeAgo";

// Somebody's page: who they are, and what they have posted. Public - a logged
// out visitor sees everything except the buttons.
function Profile() {
  const { username } = useParams();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  // "posts" | "followers" | "following"
  const [tab, setTab] = useState("posts");
  const [people, setPeople] = useState([]);
  const [peopleLoading, setPeopleLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setError("");
    setTab("posts");

    api
      .getUser(username)
      .then((result) => {
        if (!cancelled) setProfile(result.data);
      })
      .catch((profileError) => {
        if (!cancelled) setError(profileError.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [username]);

  // The follower and following lists are only fetched when their tab is
  // opened - most visits never look at them.
  useEffect(() => {
    if (tab === "posts") return;

    let cancelled = false;
    setPeopleLoading(true);

    const request = tab === "followers" ? api.getFollowers(username) : api.getFollowing(username);

    request
      .then((result) => {
        if (!cancelled) setPeople(result.data);
      })
      .catch(() => {
        if (!cancelled) setPeople([]);
      })
      .finally(() => {
        if (!cancelled) setPeopleLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [tab, username]);

  if (loading) return <p className="loading">Loading...</p>;

  if (error || !profile) {
    return (
      <div className="card card--form">
        <h1>No such person</h1>
        <p className="alert alert--error">{error}</p>
        <Link to="/people" className="btn btn--primary">
          Find people
        </Link>
      </div>
    );
  }

  return (
    <div className="columns">
      <div className="columns__main">
        <header className="profile">
          <Avatar user={profile} size={88} linked={false} />

          <div className="profile__body">
            <div className="profile__head">
              <div>
                <h1>{profile.name}</h1>
                <p className="profile__handle">@{profile.username}</p>
              </div>

              {profile.isMe ? (
                <Link to="/settings" className="btn btn--ghost btn--small">
                  Edit profile
                </Link>
              ) : (
                <FollowButton
                  username={profile.username}
                  followed={profile.followedByMe}
                  // The follower count moves with the button, so the number
                  // under it does not need a refetch to be right.
                  onChange={(data) =>
                    setProfile((current) => ({
                      ...current,
                      followedByMe: data.followed,
                      followerCount: data.followerCount,
                    }))
                  }
                />
              )}
            </div>

            {profile.bio && <p className="profile__bio">{profile.bio}</p>}

            <p className="profile__joined">Joined {timeAgo(profile.createdAt)} ago</p>
          </div>
        </header>

        <div className="tabs" role="tablist">
          {[
            { key: "posts", label: profile.postCount + " posts" },
            { key: "followers", label: profile.followerCount + " followers" },
            { key: "following", label: profile.followingCount + " following" },
          ].map((item) => (
            <button
              key={item.key}
              type="button"
              role="tab"
              aria-selected={tab === item.key}
              className={"tab" + (tab === item.key ? " tab--on" : "")}
              onClick={() => setTab(item.key)}
            >
              {item.label}
            </button>
          ))}
        </div>

        {tab === "posts" && (
          <PostList
            query={{ username: profile.username }}
            emptyTitle="Nothing posted yet"
            emptyBody={
              profile.isMe ? "Your posts will show up here." : "This account has not posted."
            }
          />
        )}

        {tab !== "posts" &&
          (peopleLoading ? (
            <p className="loading">Loading...</p>
          ) : people.length === 0 ? (
            <div className="empty">
              <p className="empty__title">
                {tab === "followers" ? "No followers yet" : "Not following anyone yet"}
              </p>
            </div>
          ) : (
            <div className="card">
              {people.map((person) => (
                <UserCard key={person.id} user={person} />
              ))}
            </div>
          ))}
      </div>
    </div>
  );
}

export default Profile;
