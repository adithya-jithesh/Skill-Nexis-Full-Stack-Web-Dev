# SkillNexis - Full Stack Web Development (MERN)

Assignment submissions for the SkillNexis Full Stack Web Development (MERN) virtual internship.

**Adithya Jithesh** - B.Tech Electronics & Computer Engineering, Somaiya Vidyavihar School of Engineering
[GitHub](https://github.com/adithya-jithesh) · [LinkedIn](https://linkedin.com/in/adithyajithesh)

### Live sites

| # | Assignment | Live link |
|---|------------|-----------|
| 1 | Personal Portfolio | https://adithya-jithesh.github.io/Skill-Nexis-Full-Stack-Web-Dev/portfolio/ |
| 2 | React Components Practice | https://adithya-jithesh.github.io/Skill-Nexis-Full-Stack-Web-Dev/shop/ |
| 3 | Mini Project - Blog UI | https://adithya-jithesh.github.io/Skill-Nexis-Full-Stack-Web-Dev/blog/ |

---

## Week 1 - Frontend Fundamentals (HTML, CSS, React Basics)

**Topics:** HTML5 semantic structure · CSS3 (Flexbox, Grid, Responsive Design) · JavaScript ES6+ · React basics (Components, Props, State, Events)

| # | Deliverable | Folder | Status |
|---|-------------|--------|--------|
| 1 | Personal Portfolio Website | [`Week1/01-portfolio`](Week1/01-portfolio) | ✅ Done |
| 2 | React Components Practice | [`Week1/02-react-components`](Week1/02-react-components) | ✅ Done |
| 3 | Mini Project - React Blog UI | [`Week1/03-react-blog-ui`](Week1/03-react-blog-ui) | ✅ Done |

### 1. Personal Portfolio Website
Responsive portfolio built with plain HTML5, CSS3 and vanilla JavaScript - no frameworks.

- Semantic HTML5 structure (`header`, `nav`, `main`, `section`, `article`, `footer`)
- Required sections: About, Education, Projects, Contact (plus Hero and Skills)
- Responsive navigation bar with an animated hamburger menu on mobile
- Layout built with CSS Flexbox and Grid (`auto-fit` + `minmax` responsive columns)
- Vanilla JavaScript contact form validation with inline, per-field error messages

**Run it:** open `Week1/01-portfolio/index.html` in a browser, or serve it with
`npx http-server Week1/01-portfolio -p 5500`.

### 2. React Components Practice
Five reusable components built with React 19 and Vite, wired together into a
small supermarket app: browse products, search and filter them, add stock, and
add items to a cart.

| Component | Demonstrates |
|-----------|--------------|
| `Button`  | Props with defaults, `children`, a `disabled` prop |
| `Card`    | Props, conditional rendering, a value calculated from a prop |
| `Header`  | Derived props (live cart count and total), conditional button |
| `Form`    | `useState`, controlled inputs, validation, lifting state up |
| `Footer`  | Pure presentational component, rendering an array with `.map()` |

State lives in `App.jsx` and flows down through props: the form adds products,
cards sell and remove them, the search box and category dropdown filter them,
and the header cart updates automatically.

**Run it:**
```bash
cd Week1/02-react-components
npm install
npm run dev
```

### 3. Mini Project - React Blog UI
A blog that renders post cards from a local JSON file, with search and filtering.

- Ten posts stored in `src/data/posts.json` and pulled in with a plain `import`
- Post cards rendered with `.map()` over the filtered array
- Search box matching the title, summary and tags
- Category sidebar built from the posts themselves, so the buttons follow the data
- Search and category apply together, with a "no posts found" message and a clear button
- Each card expands its full text with its own `useState`, independent of the others

| Component | Demonstrates |
|-----------|--------------|
| `Header`   | Props, a live "showing x of y" count |
| `Sidebar`  | Controlled input, list rendering, conditional class names |
| `PostCard` | Its own local state, conditional rendering, rendering an array of tags |
| `Footer`   | Pure presentational component |
| `Button`   | Reused from assignment 2 |

**Run it:**
```bash
cd Week1/03-react-blog-ui
npm install
npm run dev
```

---

## Week 2 - Backend Development (Node.js, Express.js, MongoDB)

**Topics:** Node.js basics and NPM setup - Express.js framework and routing - MongoDB and Mongoose - REST API design principles - Authentication using JWT and bcrypt

| # | Deliverable | Folder | Port | Status |
|---|-------------|--------|------|--------|
| 1 | To-Do List REST API | [`Week2/01-todo-api`](Week2/01-todo-api) | 5000 | Done |
| 2 | User Authentication API | [`Week2/02-auth-api`](Week2/02-auth-api) | 5001 | Done |
| 3 | Mini Project - Notes App Backend | [`Week2/03-notes-app-backend`](Week2/03-notes-app-backend) | 5002 | Done |
| + | Notes App Frontend (extra) | [`Week2/04-notes-app-frontend`](Week2/04-notes-app-frontend) | 5173 | Done |

Three standalone Express APIs, each with its own README and Postman collection.
They are Node servers with MongoDB behind them, so unlike Week 1 they are not on
GitHub Pages - they run locally, which is what the assignment asks for. See
[`Week2/README.md`](Week2/README.md) for the full write-up.

### 1. To-Do List REST API
CRUD endpoints for tasks, stored in MongoDB and tested in Postman.

- `GET`, `POST`, `PUT`, `PATCH` and `DELETE` on `/api/tasks`, with optional
  `?completed=` and `?priority=` filters
- Validation on the Mongoose schema, so bad data never reaches the database
- Routes, controllers, model and error handling in separate files
- Every failure returns JSON with the right status code, never an HTML crash page

### 2. User Authentication API
Registration and login with hashed passwords and JWT-protected routes.

- Passwords hashed by a bcrypt `pre("save")` hook with a per-user salt
- The hash is `select: false`, so it stays out of query results by default
- `POST /api/auth/register` and `/login` return a signed JWT; `GET /api/auth/me`
  needs it
- Wrong password and unknown email give the same error, so the API cannot be
  used to find out which addresses have accounts

### 3. Mini Project - Notes App Backend
A notes API with full CRUD where every note route is behind JWT auth.

- All of `/api/notes` guarded in one line with `router.use(protect)`
- Notes belong to a user: every query filters on `owner` as well as `_id`
- Another user's note returns `404`, the same as one that never existed, so the
  API gives nothing away
- Search across title, content and tags, filter by tag or pinned, and tag counts
- Verified with 36 automated checks against a live server and database,
  including a second account that cannot read, change or delete the first
  account's notes

### Extra - Notes App Frontend
Not asked for by Week 2, which stops at the API. A React app that makes the
mini project usable without Postman.

- Logs in against the notes API and keeps the JWT in `localStorage`, so a
  refresh does not log you out
- Sends it as `Authorization: Bearer <token>` on every request; a `401` clears
  the session and returns to the login screen
- Write, edit, pin and delete notes, with search and tag filters
- Searching and filtering ask the API rather than filtering a local copy, so
  the database does the work

**Run any of them:**
```bash
cd Week2/01-todo-api      # or 02-auth-api, or 03-notes-app-backend
npm install
cp .env.example .env
npm run dev
```

---

## Repository structure

```
.
├── README.md
├── Week1/                          # Frontend - HTML, CSS, React
│   ├── 01-portfolio/               # HTML + CSS + vanilla JS
│   │   ├── index.html
│   │   ├── css/style.css
│   │   └── js/script.js
│   ├── 02-react-components/        # Vite + React
│   └── 03-react-blog-ui/           # Vite + React
└── Week2/                          # Backend - Node, Express, MongoDB
    ├── 01-todo-api/                # Express + Mongoose
    │   ├── src/                    # server, config, models, routes, controllers, middleware
    │   └── postman/                # importable Postman collection
    ├── 02-auth-api/                # + bcrypt and JWT
    └── 03-notes-app-backend/       # CRUD behind JWT, notes owned by a user
```
