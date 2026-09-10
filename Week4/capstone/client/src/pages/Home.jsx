import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../api";
import Composer from "../components/Composer";
import PostList from "../components/PostList";
import UserCard from "../components/UserCard";
import { useAuth } from "../context/AuthContext";

// The two timelines. Which one you are on lives in the URL rather than in
// state, so a tab can be linked to and survives a refresh.
function Home() {
  const { isLoggedIn } = useAuth();
  const [params, setParams] = useSearchParams();

  // Logged out there is only one timeline worth showing, so the tab defaults
  // to "everyone" and the personal feed is not offered.
  const scope = isLoggedIn ? params.get("scope") || "following" : "everyone";

  // Bumped when a post is written, which is what makes it appear at the top
  // without a page reload.
  const [reload, setReload] = useState(0);
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    if (!isLoggedIn) return;

    api
      .getUsers({ limit: 5 })
      .then((result) => setSuggestions(result.data))
      .catch(() => setSuggestions([]));
  }, [isLoggedIn]);

  function handleFollowChange(username, data) {
    setSuggestions((current) =>
      current.map((user) =>
        user.username === username ? { ...user, followedByMe: data.followed } : user
      )
    );

    // Following someone changes what belongs in the personal feed.
    setReload((n) => n + 1);
  }

  return (
    <div className="columns">
      <div className="columns__main">
        {isLoggedIn ? (
          <Composer onPosted={() => setReload((n) => n + 1)} />
        ) : (
          <div className="card card--prompt">
            <p>
              <Link to="/register">Create an account</Link> or <Link to="/login">log in</Link> to
              post, like and reply. Reading is open to everyone.
            </p>
          </div>
        )}

        {isLoggedIn && (
          <div className="tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={scope === "following"}
              className={"tab" + (scope === "following" ? " tab--on" : "")}
              onClick={() => setParams({})}
            >
              Following
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={scope === "everyone"}
              className={"tab" + (scope === "everyone" ? " tab--on" : "")}
              onClick={() => setParams({ scope: "everyone" })}
            >
              Everyone
            </button>
          </div>
        )}

        <PostList
          query={scope === "following" ? { scope: "following" } : {}}
          reload={reload}
          emptyTitle={scope === "following" ? "Your feed is quiet" : "Nothing here yet"}
          emptyBody={
            scope === "following"
              ? "Follow a few people, or switch to Everyone to see what is going on."
              : "Be the first to post something."
          }
        />
      </div>

      <aside className="columns__side">
        {isLoggedIn && suggestions.length > 0 && (
          <div className="card">
            <h2 className="card__title">Who to follow</h2>
            {suggestions.map((user) => (
              <UserCard key={user.id} user={user} onFollowChange={handleFollowChange} />
            ))}
            <Link to="/people" className="card__more">
              Find more people
            </Link>
          </div>
        )}
      </aside>
    </div>
  );
}

export default Home;
