# Social Feed - API

The backend for the Week 4 capstone: accounts, posts, likes, comments and
following, on Express and MongoDB. Port 5006 locally; on a host the port comes
from the environment.

```bash
npm install
cp .env.example .env      # then put a real JWT_SECRET in it
npm run dev               # http://localhost:5006
```

The server refuses to start without a real `JWT_SECRET` or a `MONGODB_URI`:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Routes

| Method | Route | Who can |
|--------|-------|---------|
| POST | `/api/auth/register` | anyone |
| POST | `/api/auth/login` | anyone - by email **or** username |
| GET | `/api/auth/me` | the account itself |
| PUT | `/api/auth/me` | change display name and bio |
| POST | `/api/auth/me/avatar` | upload an avatar (field `avatar`, 1 MB) |
| GET | `/api/posts` | anyone - `?scope=following` `?username=` `?page=` `?limit=` |
| POST | `/api/posts` | logged in - text, optional image (field `image`, 4 MB) |
| GET | `/api/posts/:id` | anyone |
| DELETE | `/api/posts/:id` | the author |
| POST | `/api/posts/:id/like` | logged in - toggles |
| GET | `/api/posts/:id/likes` | anyone |
| GET | `/api/posts/:id/comments` | anyone |
| POST | `/api/posts/:id/comments` | logged in |
| DELETE | `/api/comments/:id` | its author, or the post's owner |
| GET | `/api/users` | anyone - `?search=` |
| GET | `/api/users/:username` | anyone |
| POST | `/api/users/:username/follow` | logged in - toggles |
| GET | `/api/users/:username/followers` | anyone |
| GET | `/api/users/:username/following` | anyone |
| GET | `/api/health` | anyone - what the host pings |

`postman/social-feed.postman_collection.json` has all 41 requests, chained.

## The decisions worth explaining

**Reading is public, writing is not.** A feed nobody can see before signing up
is a poor advertisement for itself, so the timeline, profiles and comment
threads are all readable logged out. That created a middle case the earlier
weeks did not have: a route that works either way but shows *more* to someone
logged in - a post carries "have you liked this?" only if there is a "you". So
alongside `protect` there is now `optionalAuth`, which attaches the viewer when
a token is sent and simply carries on when it is not.

**Likes and follows are their own collections, not arrays.** An array of likes
on the post document would mean a popular post carrying thousands of ids in
every read, and "has this person liked it?" would be a scan. As rows with a
unique compound index, that question is an indexed lookup - and the uniqueness
is enforced by the database, so two requests racing each other cannot both
insert. The test suite fires three simultaneous likes at one post and checks
the counter still matches the number of rows.

**Counters are stored, not counted.** `likeCount`, `commentCount`,
`followerCount` and `postCount` live on the document and move with `$inc`
wherever the underlying row is created or removed. A feed of twenty posts would
otherwise need forty extra count queries to render.

**One toggle endpoint, not like/unlike.** The client knows the heart was
tapped, not which way round it should end up - and if it decided, a double tap
on a slow connection could send two "like"s and lose track. The server does
`deleteOne` first and inserts only if nothing was removed, so the counter moves
by exactly the number of rows that actually changed.

**404 for someone else's post, 403 for someone else's comment.** Deleting a
post you do not own answers 404, the same as a post that never existed - the
API does not confirm what it will not show you. A comment is different: it is
public, everyone can already see it, so hiding its existence would be theatre.
There the honest answer is 403 - it exists, you simply may not remove it.

**Deleting a post cleans up after itself.** Its likes, its comments and its
image all go with it, and the author's post count comes down. Otherwise the
database fills with rows counted by nothing, pointing at a post that is gone.

**Authors come back nested.** Every card in a feed shows a name and an avatar,
so the post carries its author's public fields rather than an id the client
would have to resolve - and `populate` names those fields explicitly, so a
password hash could not travel even by accident.

## Live updates (Socket.IO)

The optional part of the brief. Socket.IO runs on the same port as the API,
because it upgrades an HTTP connection rather than opening a second server -
which is also what lets one hosted service carry both.

**The REST API is still the source of truth.** Every change is a normal HTTP
request that answers with the new state; these events only tell *other* people
that something happened. A client that never connects - a blocked network, a
host without WebSocket support - loses nothing but the immediacy.

Three kinds of room:

| Room | Who is in it | What it carries |
|------|--------------|-----------------|
| `everyone` | every socket, logged in or not | the public timeline, count changes, deletions |
| `user:<id>` | one account | posts by people that account follows |
| `post:<id>` | whoever has that thread open | replies, and their removal |

**Follower fan-out happens on the server.** When a post is created its author's
followers are looked up and the event goes to their personal rooms. The
alternative - broadcasting every post to everybody and letting each client
decide - would mean sending people posts that are none of their business and
asking the browser to know who it follows.

**The handshake carries the same JWT as the REST calls,** and a socket without
one is not refused: anonymous readers get the public timeline, they simply have
no personal room. An expired or forged token is treated as anonymous rather
than as an error, because the HTTP API is what refuses writes and it checks the
token every single time.

**Count events carry counts only.** `post:counts` sends `likeCount` and
`commentCount`, never who liked it - whether *you* liked something is answered
per viewer and is nobody else's business. The test suite checks the payload has
no `likedByMe` in it.

Events: `post:new`, `post:counts`, `post:deleted`, `comment:new`,
`comment:deleted`, `presence`. The client asks for a thread with
`post:watch` / `post:unwatch`.

## Built to be deployed

This one is meant to run somewhere other than a laptop, so a few things differ
from Weeks 2 and 3:

- **The port comes from the environment.** Hosts hand a port to the process;
  5006 is only the local fallback.
- **CORS takes a list.** `CLIENT_URL` is comma separated, because a deployed
  site usually has more than one legitimate origin (the real domain, and
  preview builds). Anything not on the list is refused.
- **`/api/health` does no database work,** so a slow query cannot make the
  instance look dead and get it restarted.
- **WebSockets need a host that supports them.** Render does; a serverless
  platform generally does not, which is one reason the API is not going on
  Vercel next to the front end.
- **The upload folder is configurable** through `UPLOAD_DIR`. This matters:
  most free hosting tiers have an ephemeral filesystem, so uploaded images
  vanish on the next deploy or restart unless the folder points at a mounted
  disk. `DEPLOYMENT.md` covers it in the deployment phase.
- **The server refuses to start** on a missing `MONGODB_URI` or a placeholder
  `JWT_SECRET`, rather than booting into a broken state.

## Checks

83 automated HTTP checks against a live server, database and disk, with two
accounts: registration and both login paths, the identical message for a wrong
password and an unknown account, avatars (upload, serve, size and type
refusals), posting with and without an image, the public timeline versus the
personal feed, paging, likes including three racing at once, comment
permissions in all three directions, following and its effect on the feed,
people search, and deleting a post taking its likes, comments, image and count
with it.

A further 26 checks cover the live layer, with three sockets - two accounts and
an anonymous reader - against the same running server: presence, a post
reaching the public timeline but *not* a stranger's personal feed, the same post
reaching a follower's feed once they follow, a like moving somebody else's
screen, a reply arriving in an open thread and not in anybody else's, events
stopping after `post:unwatch`, fan-out stopping after an unfollow, and a forged
token connecting as anonymous but never receiving a personal feed.

All 109 pass.
