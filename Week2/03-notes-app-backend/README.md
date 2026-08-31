# Mini Project - Notes App Backend

The backend for a note-taking app: full CRUD over notes, with every note route
behind JWT authentication. It puts assignments 1 and 2 together - the CRUD and
REST design from the to-do API, the bcrypt and JWT work from the auth API -
and adds the piece neither of them needed: **notes belong to a user**.

## What it does

| Method | Endpoint | Protected | Does |
|--------|----------|-----------|------|
| GET | `/` | no | Health check |
| POST | `/api/auth/register` | no | Create an account, returns a JWT |
| POST | `/api/auth/login` | no | Log in, returns a JWT |
| GET | `/api/auth/me` | yes | The logged-in user |
| GET | `/api/notes` | yes | Your notes. `?search=` `?tag=` `?pinned=true` |
| GET | `/api/notes/tags` | yes | Your tags, with how often each is used |
| GET | `/api/notes/:id` | yes | One note |
| POST | `/api/notes` | yes | Create a note |
| PUT | `/api/notes/:id` | yes | Update a note (only the fields you send) |
| PATCH | `/api/notes/:id/pin` | yes | Flip `pinned` |
| DELETE | `/api/notes/:id` | yes | Delete a note |

Send the token as `Authorization: Bearer <token>`.

## Running it

```bash
cd Week2/03-notes-app-backend
npm install
cp .env.example .env
# put a real secret in .env:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
npm run dev
```

Runs on <http://localhost:5002>, so all three Week 2 APIs can run at once
(5000, 5001, 5002).

### Environment variables

| Variable | Default | What it is |
|----------|---------|------------|
| `PORT` | `5002` | Port the API listens on |
| `MONGODB_URI` | `mongodb://127.0.0.1:27017/notes_app` | Local MongoDB, or an Atlas string |
| `JWT_SECRET` | *(none)* | Signs and verifies tokens |
| `JWT_EXPIRES_IN` | `7d` | How long a token lasts |

## The part that matters: notes are private

Checking the token proves *who* is asking. It says nothing about *what they
are allowed to touch*. Both are needed here.

Every query filters on the owner as well as the id:

```js
const note = await Note.findOne({ _id: req.params.id, owner: req.user._id });
```

- The owner comes from the **token**, never from the request body, so nobody
  can create a note inside someone else's account by sending `owner`.
- Reaching for another user's note returns **404, not 403**. A 403 would
  confirm the note exists and just isn't yours. A 404 gives nothing away -
  it looks exactly like a note that was never there.
- `router.use(protect)` guards the whole notes router in one line, so a route
  added later is protected by default rather than by memory.

## Note shape

```json
{
  "title": "Express middleware order",
  "content": "notFound and errorHandler have to be added last, or they never run.",
  "tags": ["express", "node", "backend"],
  "pinned": false
}
```

Tags are lowercased and trimmed by the schema, so `"React"`, `"react "` and
`"react"` all become the same tag and filtering works as expected. Listing
puts pinned notes first, then the most recently updated.

`?search=` matches title, content and tags, case-insensitively, and escapes
regex characters first - so searching for `c++` or `(` looks for that text
rather than being read as a broken pattern.

## Tested

`36` checks were run against a live server and a live MongoDB, covering CRUD,
search and filters, validation, and the isolation between two accounts:

| Group | Result |
|-------|--------|
| Register / login / `me` | pass |
| Notes routes reject no token, a junk token, an expired token | pass |
| Create, read, update, toggle pin, delete | pass |
| Partial update keeps the untouched fields | pass |
| Tags lowercased, pinned notes sorted first, tag counts | pass |
| Search: plain, case-insensitive, and with regex characters | pass |
| **User B cannot list, read, update, pin or delete user A's notes** | pass (404 each) |
| **`owner` in the request body is ignored** | pass |
| Validation errors `400`, unknown ids `404` | pass |

Import `postman/notes-app.postman_collection.json` to run these by hand. It is
organised into folders - Auth, Notes, "Second user - proof notes are private",
and Errors - and the tokens and note ids are passed between requests
automatically.

## How the code is organised

```
src/
├── server.js                        # Express setup, mounts both routers
├── config/db.js                     # the MongoDB connection
├── models/
│   ├── User.js                      # bcrypt hashing hook, password check
│   └── Note.js                      # note schema, tag normalising, owner link
├── routes/
│   ├── authRoutes.js                # register / login / me
│   └── noteRoutes.js                # protected with router.use(protect)
├── controllers/
│   ├── authController.js            # registration, login, token signing
│   └── noteController.js            # CRUD, always scoped to req.user
└── middleware/
    ├── auth.js                      # protect - verifies the JWT
    └── errorHandler.js              # 404s and errors, as JSON
```

The auth half is the same code as assignment 2, kept as its own folder so each
assignment can be run and marked on its own.
