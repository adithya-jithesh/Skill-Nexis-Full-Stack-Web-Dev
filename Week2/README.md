# Week 2 - Backend Development (Node.js, Express.js, MongoDB)

Covered this week: Node and npm, Express routing, MongoDB through Mongoose,
REST API design, and authentication with JWT and bcrypt.

| # | Deliverable | Folder | Port |
|---|-------------|--------|------|
| 1 | To-do list REST API | [`01-todo-api`](01-todo-api) | 5000 |
| 2 | User authentication API | [`02-auth-api`](02-auth-api) | 5001 |
| 3 | Mini project - notes app backend | [`03-notes-app-backend`](03-notes-app-backend) | 5002 |
| + | Notes app frontend (extra) | [`04-notes-app-frontend`](04-notes-app-frontend) | 5173 |
| + | React practice set (extra) | [`05-react-practice`](05-react-practice) | 5173 |

Each folder is its own Express app - own `package.json`, own `.env.example`,
own README and Postman collection - so any one of them can be run and marked
without the others. They're on different ports so you can have all three up at
once.

## Running them

MongoDB needs to be running first. On Windows it's usually installed as a
service and already going; otherwise `mongod` starts it.

```bash
cd Week2/01-todo-api      # or 02-auth-api, or 03-notes-app-backend
npm install
cp .env.example .env
npm run dev
```

`npm run dev` uses Node's built-in `--watch` flag, so the server restarts when
you save. No nodemon.

You don't need to create the databases (`todo_api`, `auth_api`, `notes_app`)
first - MongoDB makes one the first time something writes to it. And each app
reads `MONGODB_URI` out of `.env`, so switching to Atlas is a matter of
pasting in the connection string from their dashboard. Nothing in the code
changes.

## Testing with Postman

Every app has a collection in its `postman/` folder. Import the JSON and run
the requests top to bottom - they chain, saving ids and tokens into collection
variables, so there's nothing to copy by hand between requests.

The to-do collection covers CRUD and the filters, plus two requests that fail
on purpose. The auth one does register, login, the protected route and five
failure cases. The notes collection is the big one: auth, notes CRUD, search,
and a whole folder for a second user that proves notes stay private.

## What each one was for

**The to-do API** was about REST design more than anything else. The URL names
the resource, the method says what to do with it, the status code says what
happened - 201 on create, 400 on bad input, 404 when it isn't there. Putting
validation on the Mongoose schema means bad data gets turned away before
MongoDB is touched at all.

**The auth API** was bcrypt and JWT. The plain password only exists for the
length of the request; a `pre("save")` hook hashes it with a per-user salt
before it goes anywhere near the database. The interesting bit was realising
login shouldn't tell you *why* it failed - if a wrong password and an unknown
email give different errors, you can use the login form to find out who has an
account.

**The notes backend** put both together and added ownership, which turned out
to be the part worth thinking about. Checking a token proves who's asking. It
says nothing about what they're allowed to touch. So every note query filters
on `owner` as well as `_id`, and a note belonging to someone else comes back
404 rather than 403 - a 403 would confirm it exists. I ran 36 checks against a
live server and database with two accounts to make sure that held.

## One response shape everywhere

All three answer the same way, so a front end doesn't have to special-case
them:

```json
{ "success": true,  "data": { } }
{ "success": false, "message": "What went wrong." }
```

Express 5 forwards rejected promises to the error middleware by itself, which
is why none of the controllers are wrapped in `try`/`catch`. A validation
error, a malformed id, a duplicate email, a bad token - they all come out as
JSON with the right status code.

## The extras

Week 2 asks for backends only, so neither of these was required.

`04-notes-app-frontend` is a React client that makes the mini project usable
without Postman. Start the backend on 5002 first, then the front end on 5173.

`05-react-practice` is for the practice set PDF, which is React rather than
backend and doesn't overlap with any of the above. Questions 1 and 2 were
already covered in Week 1, so this app does the other three - a to-do with add
and delete, React Router navigation, and CSS modules. No backend, no `.env`,
just `npm install && npm run dev`.

## Why these aren't hosted

Week 1 is on GitHub Pages, which only serves static files. These are Node
servers with a database behind them, so there's nothing for Pages to serve.
They run locally against a local MongoDB, which is what the assignment asked
for - MongoDB for storage, Postman for testing.
