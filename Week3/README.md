# Week 3 - Full Stack Integration (connecting frontend and backend)

Covered this week: connecting a React front end to an Express backend, Axios
for the calls, React Router with protected routes, the Context API for state,
form validation, and file upload with Multer.

| # | Deliverable | Folder | Ports |
|---|-------------|--------|-------|
| 1 | Full stack to-do application | [`01-fullstack-todo`](01-fullstack-todo) | api 5003, client 5173 |
| 2 | Image upload feature | [`02-image-upload`](02-image-upload) | api 5004, client 5174 |
| 3 | Mini project - task manager | [`03-task-manager`](03-task-manager) | api 5005, client 5175 |

Each folder holds a `server/` and a `client/` - two separate programs, each
with its own `package.json` and `.env.example`. Different ports throughout, so
all three can be up at once.

## Running any of them

MongoDB has to be running first. Then two terminals per project:

```bash
cd Week3/01-fullstack-todo/server     # or 02-image-upload, or 03-task-manager
npm install
cp .env.example .env                  # 01 and 03 need a real JWT_SECRET
npm run dev

cd Week3/01-fullstack-todo/client
npm install
cp .env.example .env
npm run dev
```

`npm run dev` on the servers uses Node's built-in `--watch`, so they restart on
save. No nodemon. The two with logins refuse to start while `JWT_SECRET` is
still the placeholder from `.env.example`:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## What changed now that a browser is the client

Week 2 stopped at the API, with Postman standing in for a front end. Three
things follow from putting a browser in front of it.

**CORS matters.** The client is served from one port and the API listens on
another, so every request is cross-origin. Week 2 allowed any origin because
only Postman was calling; all three of these name the client instead:

```js
app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173" }));
```

Any other site loaded in a browser gets no `Access-Control-Allow-Origin` for
these APIs, and the request is blocked before the response is handed over.

**Axios earns its place over fetch.** Not for the syntax - for interceptors. A
request interceptor attaches the token to every outgoing call, so no component
thinks about headers; a response interceptor turns the API's
`{ success, message }` failures into thrown `Error`s and handles a 401 in one
place by ending the session. It also reports upload progress, which with
`fetch` needs a `ReadableStream` and a good deal more code.

**Two kinds of protection, and only one of them is real.** `ProtectedRoute`
decides what to render; `protect` on the server decides what a request is
allowed to touch. The route guard is convenience - anyone can edit their own
browser - which is why every API here still checks the token on every request,
and every query filters on `owner` as well as `_id`.

## Practice set

The practice set PDF is a week behind again, the same as in Week 2. This one is
headed "Week 3 - Backend (Node.js + Express + MongoDB)" and asks for the Week 2
material:

| # | Question | Where it is answered |
|---|----------|----------------------|
| 1 | Create a REST API for managing users | [`Week2/02-auth-api`](../Week2/02-auth-api) |
| 2 | Connect Express to MongoDB using Mongoose | every backend - `src/config/db.js` |
| 3 | Implement CRUD operations | [`Week2/01-todo-api`](../Week2/01-todo-api) |
| 4 | Add JWT-based user authentication | [`Week2/02-auth-api`](../Week2/02-auth-api), and [`Week2/03-notes-app-backend`](../Week2/03-notes-app-backend) behind a guard |
| 5 | Test all routes using Postman | a collection in every `postman/` folder |

All five are already done, and this week's three projects do them again with a
front end attached, so there was nothing left to build for it. Week 2's
practice set was the same story in reverse - it covered Week 1's React
material, and the parts not already covered were built as
[`Week2/05-react-practice`](../Week2/05-react-practice).

## Why these are not hosted

GitHub Pages only serves static files. The Week 1 projects are up there; these
are Node servers with a database behind them, so there is nothing for Pages to
serve. They run locally against a local MongoDB. Pointing any of them at
MongoDB Atlas is a one-line change in `.env` - nothing in the code changes.
