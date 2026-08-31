# Week 2 - Backend Development (Node.js, Express.js, MongoDB)

**Topics:** Node.js basics and NPM setup · Express.js framework and routing ·
MongoDB and Mongoose · REST API design principles · Authentication using JWT
and bcrypt

| # | Deliverable | Folder | Port | Status |
|---|-------------|--------|------|--------|
| 1 | To-Do List REST API | [`01-todo-api`](01-todo-api) | 5000 | Done |
| 2 | User Authentication API | [`02-auth-api`](02-auth-api) | 5001 | Done |
| 3 | Mini Project - Notes App Backend | [`03-notes-app-backend`](03-notes-app-backend) | 5002 | Done |
| + | Notes App Frontend (extra, not required) | [`04-notes-app-frontend`](04-notes-app-frontend) | 5173 | Done |

Each folder is a standalone Express app with its own `package.json`, `.env.example`,
README and Postman collection, so any one of them can be run and marked on its own.
The ports differ so all three can run at the same time.

## Running any of them

MongoDB has to be running first. If it is installed as a Windows service it
already is; otherwise start it with `mongod`.

```bash
cd Week2/01-todo-api      # or 02-auth-api, or 03-notes-app-backend
npm install
cp .env.example .env
npm run dev
```

`npm run dev` uses Node's built-in `--watch`, so the server restarts on save -
no nodemon needed.

### The database

Everything reads `MONGODB_URI` from `.env`, defaulting to a local MongoDB.
Pointing an app at MongoDB Atlas instead means changing that one line to the
connection string from the Atlas dashboard - no code changes.

The databases (`todo_api`, `auth_api`, `notes_app`) do not need creating first.
MongoDB makes one the first time something is written to it.

## Testing with Postman

Each app ships a collection in its `postman/` folder. Import the JSON file into
Postman and run the requests top to bottom - they chain, saving ids and tokens
into collection variables, so nothing has to be copied by hand:

| Collection | What it covers |
|------------|----------------|
| `01-todo-api/postman/todo-api.postman_collection.json` | CRUD, filters, and two requests that fail on purpose |
| `02-auth-api/postman/auth-api.postman_collection.json` | Register, login, a protected route, and five failure cases |
| `03-notes-app-backend/postman/notes-app.postman_collection.json` | Auth, notes CRUD, search, and a second user proving notes are private |

## What each one demonstrates

**1. To-Do List REST API** - REST design done properly. The URL names the
resource, the HTTP method says what to do with it, and the status code says what
happened: `201` for a create, `400` for bad input, `404` for a missing task.
Validation lives on the Mongoose schema, so bad data is rejected before MongoDB
is touched. Routes, controllers, model and error handling sit in separate files.

**2. User Authentication API** - bcrypt and JWT. Passwords are hashed by a
`pre("save")` hook with a per-user salt, so the plain password never reaches the
database and the hash is left out of query results by default. A successful
register or login returns a signed JWT; `protect` verifies it on the guarded
route. Login gives the same error for a wrong password as for an unknown email,
so the API cannot be used to discover which addresses have accounts.

**3. Notes App Backend** - both of the above, plus ownership. Authentication
proves who is asking; it does not say what they may touch. Every note query
filters on `owner` as well as `_id`, so one user reaching for another's note
gets a `404` - the same answer as a note that never existed. This was verified
with two accounts: 36 automated checks against a live server and database,
all passing.

## Common shape

All three APIs answer in the same shape, so a front end can handle them the
same way:

```json
{ "success": true,  "data": { } }
{ "success": false, "message": "What went wrong." }
```

Express 5 forwards a rejected promise to the error middleware on its own, so the
controllers stay free of `try`/`catch` and every failure - a validation error, a
malformed id, a duplicate email, a bad token - leaves as JSON with the right
status code instead of an HTML crash page.

## The extra front end

Week 2 asks for backends only - Postman stands in for a UI. `04-notes-app-frontend`
is an extra: a React app that logs in against the notes API, keeps the JWT in
localStorage and sends it as a Bearer header, so the mini project can be
demonstrated without Postman. Run the backend on 5002 first, then the front end
on 5173.

## Note on hosting

Week 1 is on GitHub Pages, which serves static files only. These are Node
servers with a database behind them, so they cannot be hosted there - they run
locally against a local MongoDB, which is what the assignment asks for
(MongoDB for storage, Postman for testing).
