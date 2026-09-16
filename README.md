# SkillNexis - Full Stack Web Development (MERN)

My work for the SkillNexis MERN virtual internship. One folder per week, and
each project inside runs on its own.

**Adithya Jithesh** - B.Tech Electronics & Computer Engineering, Somaiya Vidyavihar School of Engineering
[GitHub](https://github.com/adithya-jithesh) · [LinkedIn](https://linkedin.com/in/adithyajithesh)

The Week 1 projects are static, so they're on GitHub Pages:

- [Portfolio](https://adithya-jithesh.github.io/Skill-Nexis-Full-Stack-Web-Dev/portfolio/)
- [React components practice](https://adithya-jithesh.github.io/Skill-Nexis-Full-Stack-Web-Dev/shop/)
- [Blog UI](https://adithya-jithesh.github.io/Skill-Nexis-Full-Stack-Web-Dev/blog/)

Weeks 2 and 3 are Node and MongoDB, so there's nothing to host on Pages -
those run locally. Week 4 is the capstone, and that one is built to deploy
properly: Atlas, Render and Vercel. More on that at the bottom.

---

## Week 1 - HTML, CSS and React basics

| # | Deliverable | Folder |
|---|-------------|--------|
| 1 | Personal portfolio | [`Week1/01-portfolio`](Week1/01-portfolio) |
| 2 | React components practice | [`Week1/02-react-components`](Week1/02-react-components) |
| 3 | Mini project - blog UI | [`Week1/03-react-blog-ui`](Week1/03-react-blog-ui) |

### Portfolio

Plain HTML, CSS and vanilla JavaScript. No framework, no build step - open
`index.html` and it works.

It has the sections the assignment asked for (About, Education, Projects,
Contact) plus a hero and a skills list. The markup is semantic rather than a
pile of divs, the layout is Flexbox and Grid, and the nav collapses into a
hamburger on mobile. The contact form is validated in JavaScript with the
error messages shown per field instead of one alert at the end.

To view it: open `Week1/01-portfolio/index.html`, or serve the folder with
`npx http-server Week1/01-portfolio -p 5500`.

### React components practice

A small supermarket app built out of five components - `Button`, `Card`,
`Header`, `Form` and `Footer`. You can add products through the form, search
and filter the shelf, and put things in a cart. Selling an item drops the
stock; emptying the cart puts it back.

The point of the assignment was props and state, so that's what the structure
shows: everything shared lives in `App.jsx` and comes down as props, and the
components push changes back up by calling functions their parent handed them.
`Form` is the one with real local state, since a half-typed product isn't
anyone else's business until it's submitted.

```bash
cd Week1/02-react-components
npm install
npm run dev
```

### Mini project - blog UI

Ten posts in a JSON file, rendered as cards, with a search box and category
buttons in the sidebar.

The posts are a plain `import` rather than a fetch, so there's no loading state
to deal with. Search matches the title, summary and tags, and works alongside
the category filter rather than replacing it. Each card tracks its own
expanded/collapsed state, because whether one post is open doesn't affect any
of the others - that was the thing I actually wanted to get right here.

```bash
cd Week1/03-react-blog-ui
npm install
npm run dev
```

---

## Week 2 - Node, Express and MongoDB

| # | Deliverable | Folder | Port |
|---|-------------|--------|------|
| 1 | To-do list REST API | [`Week2/01-todo-api`](Week2/01-todo-api) | 5000 |
| 2 | User authentication API | [`Week2/02-auth-api`](Week2/02-auth-api) | 5001 |
| 3 | Mini project - notes app backend | [`Week2/03-notes-app-backend`](Week2/03-notes-app-backend) | 5002 |
| + | Notes app frontend (extra) | [`Week2/04-notes-app-frontend`](Week2/04-notes-app-frontend) | 5173 |
| + | React practice set (extra) | [`Week2/05-react-practice`](Week2/05-react-practice) | 5173 |

Three separate Express apps, each with its own README and Postman collection.
[`Week2/README.md`](Week2/README.md) has the longer write-up; the short version:

**To-do API.** CRUD over tasks, with optional `?completed=` and `?priority=`
filters. Validation sits on the Mongoose schema so bad data never gets as far
as the database, and routes, controllers, model and error handling are all in
separate files. Every failure comes back as JSON with a sensible status code
rather than Express's default HTML crash page.

**Auth API.** Register and login, passwords hashed by a bcrypt `pre("save")`
hook with a per-user salt. The hash is `select: false`, so it stays out of
query results unless something asks for it by name - and only the login
function does. Both routes return a signed JWT, and `/api/auth/me` needs it.
A wrong password and an unknown email give the same error, so nobody can use
the login endpoint to work out which addresses have accounts.

**Notes backend.** The mini project, and the two assignments above put
together, plus the thing neither of them needed: notes belong to somebody.
`router.use(protect)` guards the whole notes router in one line, and every
query filters on `owner` as well as `_id`. Reaching for someone else's note
gets a 404 - the same answer as a note that never existed - so the API doesn't
leak what it's hiding. I checked that with a second account: 36 automated
checks against a live server and database, all passing.

### The two extras

Week 2 stops at the API, with Postman standing in for a UI, so both of these
are beyond what was asked.

`04-notes-app-frontend` is a React client for the mini project. It logs in
against the notes API, keeps the JWT in `localStorage` so a refresh doesn't
throw you out, and sends it as a Bearer header on everything. A 401 clears the
session and drops you back at the login screen. Search and tag filters ask the
API rather than filtering a copy in the browser, which is what those query
parameters on the backend were for in the first place.

`05-react-practice` covers the Week 2 practice set, which is React rather than
backend. Questions 1 and 2 were already answered by the Week 1 projects, so
this one handles the rest: a to-do with add and delete, React Router across
four routes behind a shared layout, and a `*.module.css` file per component.

**Running any of the backends:**

```bash
cd Week2/01-todo-api      # or 02-auth-api, or 03-notes-app-backend
npm install
cp .env.example .env
npm run dev
```

---

## Week 3 - Connecting the front end to the back end

| # | Deliverable | Folder | Ports |
|---|-------------|--------|-------|
| 1 | Full stack to-do application | [`Week3/01-fullstack-todo`](Week3/01-fullstack-todo) | api 5003, client 5173 |
| 2 | Image upload feature | [`Week3/02-image-upload`](Week3/02-image-upload) | api 5004, client 5174 |
| 3 | Mini project - task manager | [`Week3/03-task-manager`](Week3/03-task-manager) | api 5005, client 5175 |

Each of these is two programs: a `server/` and a `client/`, with their own
`package.json` and README. [`Week3/README.md`](Week3/README.md) has the longer
write-up.

**Full stack to-do.** The Week 2 to-do API with a React client in front of it,
and the two Week 2 assignments joined up - tasks now sit behind a login and
each account only sees its own. Axios with interceptors, so the token is
attached in one place and a 401 ends the session in one place. The session
lives in a context rather than being passed down as props, and React Router
guards the task routes. That guard is convenience, though: what actually
protects the data is the server checking the token on every request.

**Image upload.** A file cannot travel as JSON, so the form posts
`multipart/form-data` and Multer parses it. Files land on disk under a random
name rather than the one the browser sent - two people uploading `photo.jpg`
would otherwise overwrite each other, and a name like `../../src/server.js`
would write outside the uploads folder. The type check makes the claimed MIME
type and the file extension agree, and a failed database write deletes the file
again so nothing is left orphaned. On the client, the preview is drawn from the
file already in memory, before anything is sent.

**Task manager.** The mini project, and the two above put together. Tasks move
through to do, doing and done, and the board filters by status, priority, tag,
text and due date - all of it done by MongoDB, along with the sorting, the
paging and the dashboard counts. The filters are kept in the URL rather than in
state, so a filtered board is a link you can bookmark or send to someone. The
avatar upload is assignment 2 reused at a smaller limit. Checked with 67
automated tests against a live server, database and disk.

**Running any of them:**

```bash
cd Week3/01-fullstack-todo/server     # then the client, in a second terminal
npm install
cp .env.example .env
npm run dev
```

---

## Week 4 - Capstone and deployment

| Deliverable | Folder | Ports |
|-------------|--------|-------|
| Capstone - social media feed | [`Week4/capstone`](Week4/capstone) | api 5006, client 5176 |

The brief offered three projects and asked for one: e-commerce, a social media
feed, or a project management dashboard. This is the feed, including the part
marked optional - real-time updates over WebSockets.
[`Week4/README.md`](Week4/README.md) has the longer write-up.

You register, write posts with images, follow people, like and reply, and edit
your profile. Reading is public and writing needs an account, so most screens
render logged out and simply show less - which is also how the API is built,
with an `optionalAuth` that attaches a viewer when there is one.

The parts I'd point at:

**Likes and follows are their own collections,** with a unique compound index,
rather than arrays on the post. A popular post would otherwise carry thousands
of ids into every read, and "have you liked this?" would be a scan instead of
an indexed lookup. The index is also what makes two clicks racing each other
safe - the database refuses the second one.

**Live updates don't hold the app up.** Socket.IO runs on the same port as the
API, and the REST API stays the source of truth: the events only tell other
people something changed. If the socket never connects, everything still works
and the dot in the navbar goes grey. New posts collect behind a "3 new posts ↑"
pill rather than shoving the feed down while you're reading it.

**Follower fan-out happens on the server.** Broadcasting every post to every
browser and letting each one filter would mean sending people posts that are
none of their business.

Checked with 109 automated tests - 83 on the API, 26 driving three real sockets
- plus an end-to-end pass in Chrome.

```bash
cd Week4/capstone/server              # then the client, in a second terminal
npm install
cp .env.example .env                  # needs a real JWT_SECRET
npm run dev
```

---

## Repository structure

```
.
├── Week1/                          # HTML, CSS, React
│   ├── 01-portfolio/               # HTML + CSS + vanilla JS, no build step
│   ├── 02-react-components/        # Vite + React
│   └── 03-react-blog-ui/           # Vite + React
├── Week2/                          # Node, Express, MongoDB
│   ├── 01-todo-api/                # Express + Mongoose
│   │   ├── src/                    # server, config, models, routes, controllers, middleware
│   │   └── postman/                # importable collection
│   ├── 02-auth-api/                # + bcrypt and JWT
│   ├── 03-notes-app-backend/       # CRUD behind JWT, notes owned by a user
│   ├── 04-notes-app-frontend/      # React client for the mini project
│   └── 05-react-practice/          # practice set - router + CSS modules
├── Week3/                          # the two halves connected
│   ├── 01-fullstack-todo/          # server/ + client/
│   ├── 02-image-upload/            # Multer, with a preview and a gallery
│   └── 03-task-manager/            # mini project - login, filtering, avatars
└── Week4/                          # capstone
    └── capstone/                   # social feed
        ├── server/                 # Express + Mongoose + Socket.IO
        ├── client/                 # Vite + React
        └── DEPLOYMENT.md           # Atlas + Render + Vercel
```

## Why Weeks 2 and 3 aren't hosted, and Week 4 is

GitHub Pages only serves static files. The Week 2 and 3 projects are Node
servers with a database behind them, so there's nothing for Pages to serve -
they run locally against a local MongoDB, which is what those assignments asked
for anyway (MongoDB for storage, Postman for testing). Pointing any of them at
MongoDB Atlas instead is a one-line change in `.env`.

Week 4 is the one that's meant to leave the laptop, so the capstone is built
for it: the port comes from the environment, CORS takes a list of origins
because a deployed site has more than one, `/api/health` does no database work
so a slow query can't make the instance look dead, and the upload folder is
configurable for hosts with an ephemeral filesystem.
[`Week4/capstone/DEPLOYMENT.md`](Week4/capstone/DEPLOYMENT.md) is the
walkthrough - Atlas, then Render, then Vercel, then back to Render to tell it
the domain Vercel just issued.
