# Social Feed - React client

The front end for the Week 4 capstone. Vite and React, talking to the API in
`../server` over axios. Port 5176, which is the origin that API's CORS list
allows by default.

```bash
npm install
cp .env.example .env
npm run dev               # http://localhost:5176
```

Start the API first, or every screen will say it cannot reach it.

## The screens

| Route | What it is | Needs a login |
|-------|------------|---------------|
| `/` | the feed - **Following** and **Everyone** tabs | no (Following does) |
| `/p/:id` | one post and its replies | no |
| `/u/:username` | a profile: posts, followers, following | no |
| `/people` | search for people to follow | no |
| `/settings` | your name, bio and avatar | yes |
| `/login`, `/register` | getting in | no |

## The parts worth explaining

**Reading is public, so most routes are not guarded.** Only `/settings` sits
behind `ProtectedRoute`. The rest render for anybody, and simply show less: the
heart is disabled with a "Log in to like posts" tooltip, the reply box is
replaced by a prompt, and the composer becomes an invitation to sign up. That
mirrors the API, where those same routes use `optionalAuth`.

**Liking is optimistic.** The heart fills the moment it is tapped, because
waiting for a round trip to acknowledge a like feels broken. The previous state
is kept, and if the request fails it is put back and the error is shown on the
card. When the response does arrive its count wins, since two people liking at
the same time means the local guess was low.

**`PostList` owns the data, `PostCard` reports changes upward.** The feed, a
profile and the people page all show posts; only the query differs, so one
component loads, pages and holds the list, and each card hands back the post it
changed. That is why liking a post on a profile does not need the profile to
know anything about likes.

**Tabs and searches live in the URL.** `?scope=everyone` on the feed and `?q=`
on the people page are read with `useSearchParams`, so a tab or a search can be
linked to, survives a refresh, and the back button steps through them instead
of leaving the page.

**The image preview never touches the server.** `URL.createObjectURL(file)`
points at the file already in the browser, and the effect that creates it also
revokes it when the file changes - otherwise picking several images in a row
leaks all of them. The upload itself is `FormData` with no `Content-Type`
header set, because the browser has to write that itself: it carries the
multipart boundary.

**One axios instance, two interceptors.** One attaches the token to every
request; the other unwraps the response, turns the API's `{ success, message }`
failures into thrown `Error`s carrying the server's own wording, and ends the
session on any 401 - in one place rather than in every screen.

**The session is restored, not assumed.** The token is kept in `localStorage`,
but a saved token can be expired or belong to a deleted account, so the context
asks `/api/auth/me` once on load and the guard waits for that answer. Without
the wait, a refresh would bounce a logged-in user to the login page.

**Logging in returns you where you were going.** The guard remembers the
blocked URL, and both the login page and the "already logged in" redirect read
it - the second one matters, because logging in flips `isLoggedIn` and
re-renders the route before the page's own `navigate()` runs.

## Live updates

One socket for the whole app, shared through `RealtimeContext`, opened inside
`AuthProvider` so that logging in re-handshakes with the new token - otherwise
the connection would stay anonymous and never join the room that carries the
following feed.

**New posts are held behind a pill, not inserted.** A feed that moves under your
thumb while you are reading is infuriating, so arrivals collect and the count
appears as "3 new posts ↑" until you ask for them.

**Count events replace counts only.** `likedByMe` is this viewer's own state and
the event does not carry it, so a like from somebody else moves the number
without filling in your heart.

**A thread subscribes while it is open** with `post:watch`, and unsubscribes on
the way out, so two tabs on two different posts each hear only their own.

**`useRealtimeEvent` keeps the handler in a ref** so that an inline arrow
function does not tear the listener down and rebuild it on every render, and
re-attaches after a reconnect.

None of it is load-bearing: if the socket never connects, the app behaves
exactly as it did before it existed, and the dot in the navbar goes grey.

## Checked in a browser

Driven end to end in Chrome against the live API:

- registering, including the username rule rejecting `Demo Person!` before
  anything was sent;
- writing a post with an image - preview first, then the post appearing at the
  top of the feed with the image served by the API;
- following someone from the sidebar, and their posts appearing in **Following**
  immediately afterwards;
- liking: the heart filled at 60 ms, well before the response, and settled on
  the server's count;
- replying on a thread, with the count on the card moving in step and the
  delete control appearing only on comments that may be deleted;
- the profile showing the right counts, "Edit profile" instead of a follow
  button on your own page, and the following list;
- uploading an avatar and saving a bio, both reflected in the navbar;
- logged out: a profile still readable, the heart disabled, the reply box gone,
  and `/settings` redirecting to the login page - which then returned to
  `/settings` after logging in.

And with the live layer, watching one tab while a different account acted
through the API:

- a post from somebody else raised "1 new post ↑" without the feed moving, and
  clicking it put that post on top;
- their like and reply moved the numbers on the card while the tab sat idle -
  and the heart stayed hollow, because whether *this* viewer liked it is not
  what the event carries;
- a reply arrived in the open thread, taking the heading from "1 reply" to
  "2 replies";
- the presence count read 2 while a probe socket was connected and dropped back
  to 1 the moment it disconnected, so one tab holds exactly one socket.
