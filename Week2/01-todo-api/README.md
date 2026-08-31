# Assignment 1 - To-Do List REST API

A REST API for a to-do list, built with Node.js, Express and MongoDB (through
Mongoose). Tasks are stored in MongoDB and every endpoint is testable in Postman.

## What it does

| Method | Endpoint | Does |
|--------|----------|------|
| GET | `/` | Health check - lists the endpoints |
| GET | `/api/tasks` | All tasks, newest first. Optional `?completed=true` and `?priority=high` |
| GET | `/api/tasks/:id` | One task |
| POST | `/api/tasks` | Create a task |
| PUT | `/api/tasks/:id` | Update a task (only the fields you send) |
| PATCH | `/api/tasks/:id/toggle` | Flip `completed` without sending a body |
| DELETE | `/api/tasks/:id` | Delete a task |

## Running it

MongoDB has to be running first. If it is installed as a Windows service it
already is; otherwise start it with `mongod`.

```bash
cd Week2/01-todo-api
npm install
cp .env.example .env    # then edit .env if your setup differs
npm run dev             # or: npm start
```

The server starts on <http://localhost:5000> and creates the `todo_api`
database on the first write - MongoDB does not need it created up front.

### Environment variables

| Variable | Default | What it is |
|----------|---------|------------|
| `PORT` | `5000` | Port the API listens on |
| `MONGODB_URI` | `mongodb://127.0.0.1:27017/todo_api` | Local MongoDB. Replace with an Atlas connection string to run against the cloud - nothing else changes |

## Testing in Postman

Import `postman/todo-api.postman_collection.json` and run the requests from
top to bottom. "Create a task" saves the new task's id into a `{{taskId}}`
collection variable, so get / update / toggle / delete all work straight
after it with nothing to copy by hand.

The last two requests deliberately fail, to show the error handling returns
proper status codes rather than an HTML crash page.

## A request, end to end

```
POST /api/tasks  ->  express.json() turns the body into req.body
                 ->  taskRoutes.js matches the method and path
                 ->  taskController.createTask picks the allowed fields
                 ->  Task model checks them against the schema rules
                 ->  MongoDB stores the document
                 ->  201 Created with the saved task as JSON
```

If anything throws on the way, Express 5 forwards it to `errorHandler`, which
turns Mongoose validation errors into `400`, bad ids into `400`, and anything
unexpected into `500` - always as JSON in the same shape.

## How the code is organised

```
src/
├── server.js                  # sets up Express, connects to Mongo, starts listening
├── config/db.js               # the MongoDB connection
├── models/Task.js             # the task schema and its validation rules
├── routes/taskRoutes.js       # which URL and method maps to which function
├── controllers/taskController.js  # what each endpoint actually does
└── middleware/errorHandler.js # 404s and errors, as JSON
```

Routes are kept apart from controllers so the routing file stays a readable
table of contents for the API.

## Notes

- Every response has the same shape: `{ success, data }` on the way out, and
  `{ success: false, message }` when something goes wrong.
- `PUT` only copies the fields present in the body, so sending just
  `{ "completed": true }` does not blank the title.
- The controllers copy fields one by one instead of passing `req.body`
  straight to Mongoose, so a client cannot set fields it should not.
