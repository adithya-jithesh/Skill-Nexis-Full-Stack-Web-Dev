# Assignment 1 - To-Do List REST API

A to-do list API built with Express and MongoDB, through Mongoose. Tasks are
stored in the database and every endpoint can be poked at in Postman.

| Method | Endpoint | What it does |
|--------|----------|--------------|
| GET | `/` | Health check - lists the endpoints |
| GET | `/api/tasks` | All tasks, newest first. Takes `?completed=true` and `?priority=high` |
| GET | `/api/tasks/:id` | One task |
| POST | `/api/tasks` | Create a task |
| PUT | `/api/tasks/:id` | Update one - only the fields you send |
| PATCH | `/api/tasks/:id/toggle` | Flip `completed`, no body needed |
| DELETE | `/api/tasks/:id` | Delete a task |

## Running it

MongoDB has to be up first. On Windows it's usually a service that's already
running; if not, `mongod`.

```bash
cd Week2/01-todo-api
npm install
cp .env.example .env    # edit it if your setup differs
npm run dev             # or npm start
```

That puts the server on <http://localhost:5000>. The `todo_api` database gets
created on the first write, so there's nothing to set up in MongoDB first.

Two variables in `.env`: `PORT` (5000) and `MONGODB_URI`, which defaults to
`mongodb://127.0.0.1:27017/todo_api`. Swapping in an Atlas connection string
is the only change needed to run against the cloud instead.

## Testing in Postman

Import `postman/todo-api.postman_collection.json` and go top to bottom.
"Create a task" stashes the new id in a `{{taskId}}` variable, so get, update,
toggle and delete all work straight after without copying anything by hand.

The last two requests fail deliberately - they're there to show the error
handling gives back a proper status code and JSON instead of an HTML crash
page.

## How a request travels

A `POST /api/tasks` goes: `express.json()` parses the body, `taskRoutes.js`
matches the method and path, `createTask` picks out the fields it's willing to
accept, the `Task` model checks them against the schema, MongoDB stores it, and
a 201 goes back with the saved task.

If anything throws along the way, Express 5 hands it to `errorHandler`, which
turns Mongoose validation failures into 400s, malformed ids into 400s, and
anything unexpected into a 500 - always JSON, always the same shape.

## Layout

```
src/
├── server.js                      # Express setup, Mongo connection, starts listening
├── config/db.js                   # the connection itself
├── models/Task.js                 # schema and validation rules
├── routes/taskRoutes.js           # URL + method -> function
├── controllers/taskController.js  # what each endpoint actually does
└── middleware/errorHandler.js     # 404s and errors, as JSON
```

Routes are kept out of the controllers so `taskRoutes.js` reads like a table of
contents for the API - you can see every endpoint in one screen without
scrolling through the logic.

Three things worth flagging in the code:

Responses always look the same - `{ success, data }` when it works,
`{ success: false, message }` when it doesn't.

`PUT` only copies across the fields that are actually in the body, so sending
`{ "completed": true }` on its own won't wipe out the title.

The controllers copy fields one at a time instead of handing `req.body`
straight to Mongoose. Otherwise a client could set fields it has no business
setting.
