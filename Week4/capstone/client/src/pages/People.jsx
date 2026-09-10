import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../api";
import UserCard from "../components/UserCard";

// Finding people. The search term lives in the URL, so a search can be shared
// and the back button steps through searches instead of leaving the page.
function People() {
  const [params, setParams] = useSearchParams();
  const search = params.get("q") || "";

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // The box updates the URL on every keystroke, so the request waits for the
  // typing to stop.
  useEffect(() => {
    const timer = setTimeout(() => {
      let cancelled = false;
      setLoading(true);

      api
        .getUsers({ search, limit: 25 })
        .then((result) => {
          if (!cancelled) setUsers(result.data);
        })
        .catch((searchError) => {
          if (!cancelled) setError(searchError.message);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });

      return () => {
        cancelled = true;
      };
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  function handleFollowChange(username, data) {
    setUsers((current) =>
      current.map((user) =>
        user.username === username ? { ...user, followedByMe: data.followed } : user
      )
    );
  }

  return (
    <div className="columns">
      <div className="columns__main">
        <h1 className="page-title">People</h1>

        <input
          type="search"
          className="field__input"
          value={search}
          onChange={(event) => setParams(event.target.value ? { q: event.target.value } : {})}
          placeholder="Search by name or username"
          aria-label="Search people"
        />

        {error && <p className="alert alert--error">{error}</p>}

        {loading ? (
          <p className="loading">Loading...</p>
        ) : users.length === 0 ? (
          <div className="empty">
            <p className="empty__title">{search ? "Nobody matches that" : "Nobody here yet"}</p>
            <p>{search ? "Try a different name." : "Accounts will appear as people sign up."}</p>
          </div>
        ) : (
          <div className="card">
            {users.map((user) => (
              <UserCard key={user.id} user={user} onFollowChange={handleFollowChange} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default People;
