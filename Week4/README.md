# Week 4 - Capstone Project & Deployment

Covered this week: advanced React components and API integration, testing and
debugging, deployment on cloud platforms (Vercel, Netlify, Render, MongoDB
Atlas), and documentation.

| Deliverable | Folder | Ports |
|-------------|--------|-------|
| Capstone - social media feed | [`capstone`](capstone) | api 5006, client 5176 |

The brief offered three projects and asked for one: an e-commerce app, a social
media feed, or a project management dashboard. This is the second, including
the part it marked optional - real-time updates over WebSockets.

## What it is

A social feed. You register, write posts with images, follow people, like and
reply, and edit your own profile. Reading is public; writing needs an account.
Anything anyone else does shows up without a reload.

Two programs, as in Week 3 - [`capstone/server`](capstone/server) is the
Express API, [`capstone/client`](capstone/client) is the React front end - each
with its own README covering the decisions inside it.

## Running it

MongoDB has to be running. Then two terminals:

```bash
cd Week4/capstone/server
npm install
cp .env.example .env          # then put a real JWT_SECRET in it
npm run dev                   # http://localhost:5006

cd Week4/capstone/client
npm install
cp .env.example .env
npm run dev                   # http://localhost:5176
```

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

The server refuses to start on a placeholder `JWT_SECRET` or a missing
`MONGODB_URI`, rather than booting into a state where logging in quietly does
nothing useful.

## How it was built

Four phases, one commit each, because the thing is too big to review in one
lump and each phase is worth reading on its own.

**Phase 1 - the API.** Five collections and twenty routes. The decisions that
took the most thought were about shape rather than syntax: likes and follows
are their own collections with a unique compound index instead of arrays on the
post, so "has this person liked it?" is an indexed lookup and two clicks racing
each other cannot both insert. Counters are stored and moved with `$inc`, so a
feed of twenty posts does not need forty extra queries to render.

**Phase 2 - the client.** Eight screens, one axios instance, one auth context.
Reading is public, so only `/settings` sits behind a guard and the rest simply
show less when logged out. Liking is optimistic - the heart fills before the
round trip, and rolls back if the request fails.

**Phase 3 - live updates.** Socket.IO on the same port as the API, because it
upgrades an HTTP connection rather than opening a second server, which is also
what lets one hosted service carry both. Follower fan-out happens on the
server: broadcasting every post to every browser and letting each one filter
would mean sending people posts that are none of their business. None of it is
load-bearing - if the socket never connects, the app behaves exactly as it did
in phase 2.

**Phase 4 - deployment.** Below.

## Testing

109 automated checks against a live server, database and disk:

- **83 on the API** - registration and both login paths, the identical message
  for a wrong password and an unknown account, avatar upload with its size and
  type refusals, the public timeline versus the personal feed, paging, likes
  including three fired at one post simultaneously, comment permissions in all
  three directions, following and its effect on the feed, and deleting a post
  taking its likes, comments, image and count with it.
- **26 on the live layer** - three sockets, two accounts and an anonymous
  reader, checking that a post reaches the public timeline but not a stranger's
  personal feed, that a like moves someone else's screen, that events stop
  after `post:unwatch`, and that a forged token connects as anonymous but never
  receives a personal feed.

All 109 pass. Start the server, then in a second terminal:

```bash
cd Week4/capstone/server
npm test                      # both suites
```

They run against a live server, database and disk rather than against mocks,
which is slower and needs the server up - but a mocked `Like.create` would
cheerfully pass the test for three simultaneous likes, when the thing being
checked is the unique index inside MongoDB. Same for the upload limits (Multer
and the filesystem) and every socket test (a connection that really upgraded).

Each run stamps its accounts with a fresh suffix so repeat runs do not collide
on the unique username index, but they leave their data behind rather than
tidying up - so these want a scratch database, not one with anything real in
it.

The client was driven end to end in Chrome on top of that - both of the
capstone's READMEs list what was checked.

The deployment phase turned up two bugs that local testing could not have:
CORS refused unknown origins by throwing, which answered 500 rather than simply
withholding the header, and the error handler would have shipped stack traces
to the public unless `NODE_ENV` was set to `production` - which the host does
not do for you.

## Deployment

[`capstone/DEPLOYMENT.md`](capstone/DEPLOYMENT.md) is the walkthrough. The
short version:

| Piece | Goes on | Why |
|-------|---------|-----|
| MongoDB | Atlas | a database has to outlive the process querying it |
| `server/` | Render | a long-running process, which Socket.IO needs |
| `client/` | Vercel | `npm run build` makes static files; a CDN suits them |

The API is not on Vercel next to the front end because Vercel runs serverless
functions - started for a request, torn down after it - and a WebSocket is the
opposite, a connection deliberately held open with its room membership in that
process's memory.

The awkward part is a loop: the API has to allow the front end's origin, the
front end has to know the API's URL, and neither domain exists until it is
deployed. It is broken by deploying the API first with the wrong `CLIENT_URL`
and going back to fix it once Vercel has issued a domain. Skipping that last
step gives the classic symptom - the site loads, looks perfect, and every
request fails with a CORS error.

Two honest limitations of the free tiers, both documented rather than hidden:
uploaded images do not survive a redeploy without a paid disk, and the API
sleeps after about fifteen minutes, so the first request afterwards waits
roughly fifty seconds while it wakes.

## Practice set

| # | Question | Where it is answered |
|---|----------|----------------------|
| 1 | Integrate React frontend with Node.js backend | [`capstone`](capstone) - and all three Week 3 projects |
| 2 | Implement login/signup flow | [`capstone`](capstone) - register, login by email or username, JWT in context |
| 3 | Deploy frontend on Vercel and backend on Render | [`capstone/DEPLOYMENT.md`](capstone/DEPLOYMENT.md) |
| 4 | Create a mini e-commerce app (products + cart) | [`Week1/02-react-components`](../Week1/02-react-components) - products, search, stock and a cart, though front end only |
| 5 | Submit final project with GitHub link | this repository |

Question 4 is the one the capstone does not answer: it is the *other* project
option from the same brief, which asked for one of the three rather than all
of them. The Week 1 supermarket app covers products and a cart as a React
exercise, without a backend behind it.

## What I would do next

- Uploads to object storage rather than a disk, with the database holding a URL
  - the version that survives a redeploy and more than one instance.
- Rate limiting on the write routes. Nothing stops an account posting in a
  loop right now.
- The feed query is `find` with a skip and a limit, which gets slower the
  further back you page. Cursor paging on the post id would not.
