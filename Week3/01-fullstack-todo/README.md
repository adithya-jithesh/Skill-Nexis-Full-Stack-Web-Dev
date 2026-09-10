# Week 3, assignment 1 - Full Stack To-Do Application

The Week 2 to-do API with a React front end in front of it, and the two Week 2
assignments joined up: the tasks are now behind a login, and each account only
sees its own.

```
01-fullstack-todo/
├── server/     Express + MongoDB, port 5003
└── client/     React + Vite, port 5173
```

## Running it

MongoDB has to be running first. On Windows it is usually installed as a
service and already going; otherwise `mongod` starts it.

Two terminals - the API and the client are separate programs.

```bash
# terminal 1
cd Week3/01-fullstack-todo/server
npm install
cp .env.example .env      # then put a real JWT_SECRET in it
npm run dev               # http://localhost:5003

# terminal 2
cd Week3/01-fullstack-todo/client
npm install
cp .env.example .env
npm run dev               # http://localhost:5173
```

The server refuses to start while `JWT_SECRET` is still the placeholder. Get
one with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## The API

Same response shape as everything in Week 2, so the client never has to
special-case a route:

```json
{ "success": true,  "data": { } }
{ "success": false, "message": "What went wrong." }
```

| Method | Route | What it does |
|--------|-------|--------------|
| POST | `/api/auth/register` | create an account, returns a JWT |
| POST | `/api/auth/login` | log in, returns a JWT |
| GET | `/api/auth/me` | the account the token belongs to |
| GET | `/api/tasks` | your tasks - `?completed=` `?priority=` `?search=` |
| GET | `/api/tasks/stats` | total, completed, active, high priority |
| GET | `/api/tasks/:id` | one task |
| POST | `/api/tasks` | create |
| PUT | `/api/tasks/:id` | update |
| PATCH | `/api/tasks/:id/toggle` | flip completed |
| DELETE | `/api/tasks/:id` | delete |

Everything under `/api/tasks` needs `Authorization: Bearer <token>`.
`postman/fullstack-todo.postman_collection.json` has all of it, including the
failure cases; the requests chain, so there is nothing to copy by hand.

## What was new this week

**Two programs talking to each other.** Week 2 stopped at the API with Postman
standing in for a UI. Now a browser is the client, which is what makes CORS
matter: the front end is served from port 5173 and the API listens on 5003, so
every request is cross-origin. Week 2 allowed any origin because only Postman
was calling. This one names the client:

```js
app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173" }));
```

Any other site a browser loads gets no `Access-Control-Allow-Origin` for this
API and the request is blocked before the response is handed over.

**Axios instead of fetch.** The Week 2 front end wrapped `fetch` in a helper.
This one uses axios, and the reason is interceptors. A request interceptor
attaches the token to every outgoing call, so no component ever thinks about
headers. A response interceptor unwraps `response.data`, turns a failure into a
thrown `Error` carrying the backend's own message, and - the useful part -
handles a 401 in one place by ending the session. Without it, every screen
would need its own copy of "if this came back 401, log out".

**Context instead of props.** Who is logged in is needed by the navbar, the
route guard, both auth pages and the dashboard. Passing it down as props would
mean threading it through every component in between, so it lives in a context
(`src/context/AuthContext.jsx`) and any component asks for it with `useAuth()`.

**Routing, with a guard.** Five routes: `/login`, `/register`, `/tasks`,
`/tasks/:id` and a catch-all. `ProtectedRoute` wraps the last two - it reads
the session from the context and renders `<Outlet />` only when there is one,
otherwise it redirects to `/login` and remembers where you were headed, so
logging in continues to that page instead of always landing on the dashboard.

That guard is convenience, not security. Anyone can edit their own browser;
what actually protects the data is `router.use(protect)` on the server, which
is why the API still checks the token on every single request.

**Restoring a session properly.** The token is kept in `localStorage`, so a
refresh does not log you out. But a saved token only means one was saved at
some point - it can be expired, or belong to a deleted account. So the context
starts in a `checking` state and asks `/api/auth/me` once on load. The guard
waits for that instead of redirecting, which is what stops a logged-in user
being thrown out on every reload.

**Form validation.** `src/validation.js` holds the rules, and they deliberately
match the Mongoose schema: the server is still the one that decides, but a typo
is caught without a round trip and the message appears under the field that
caused it. Registration has one rule the server does not, the confirm-password
check, because the server is never sent the second copy.

**Filtering on the server.** The status, priority and search filters are query
parameters, not a `.filter()` over a copy of the list in the browser - the same
query parameters the Week 2 API already had. The search waits 300 ms after
typing stops, so a five letter word is one request rather than five.

**Counting in the database.** The four numbers across the top come from
`/api/tasks/stats`, which is an aggregation pipeline. Counting the list on
screen instead would give the wrong totals the moment a filter is on, since
that list is only the matching tasks.

## Tasks belong to somebody

The Week 2 to-do API had one shared list. Here the `Task` schema has an `owner`
and every query filters on it as well as the id:

```js
const task = await Task.findOne({ _id: req.params.id, owner: req.user._id });
```

The owner comes from the token, never from the request body - otherwise a
client could create tasks inside someone else's account. Reaching for another
user's task returns **404, not 403**: a 403 would confirm the task exists.

I checked that with two accounts: 46 automated checks against a live server and
database, all passing - registration and login, every CRUD route, the filters,
the stats, the validation failures, and a second account failing to read,
update, toggle or delete the first account's task.
