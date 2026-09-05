# Mini Project - Notes App Backend

A backend for a note-taking app: full CRUD over notes, every note route behind
JWT auth. It's the first two assignments stuck together - the CRUD and REST
design from the to-do API, the bcrypt and JWT work from the auth API - with the
one piece neither of them needed, which is that notes belong to somebody.

| Method | Endpoint | Token | What it does |
|--------|----------|-------|--------------|
| GET | `/` | no | Health check |
| POST | `/api/auth/register` | no | Create an account, returns a JWT |
| POST | `/api/auth/login` | no | Log in, returns a JWT |
| GET | `/api/auth/me` | yes | The logged-in user |
| GET | `/api/notes` | yes | Your notes. `?search=` `?tag=` `?pinned=true` |
| GET | `/api/notes/tags` | yes | Your tags, and how often each is used |
| GET | `/api/notes/:id` | yes | One note |
| POST | `/api/notes` | yes | Create a note |
| PUT | `/api/notes/:id` | yes | Update one - only the fields you send |
| PATCH | `/api/notes/:id/pin` | yes | Flip `pinned` |
| DELETE | `/api/notes/:id` | yes | Delete a note |

Token goes in as `Authorization: Bearer <token>`.

## Running it

```bash
cd Week2/03-notes-app-backend
npm install
cp .env.example .env
# generate a secret and paste it into .env:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
npm run dev
```

Port 5002, which means all three Week 2 APIs can run together on 5000, 5001
and 5002. Same four `.env` variables as the auth API, with `notes_app` as the
default database.

## The part I actually had to think about

A token proves *who* is asking. It says nothing about *what they're allowed to
touch*. Both matter here, and only the first one was covered by assignment 2.

So every query filters on the owner as well as the id:

```js
const note = await Note.findOne({ _id: req.params.id, owner: req.user._id });
```

The owner comes off the token, never out of the request body. Otherwise you
could create a note inside someone else's account just by sending an `owner`
field along with it.

Asking for somebody else's note gets a 404 rather than a 403. A 403 would be
admitting the note exists and just isn't yours, which is a small leak but a
real one - you could walk ids and map out who has what. A 404 looks exactly
like a note that was never there.

And `router.use(protect)` guards the whole notes router in one line, so a route
someone adds later is protected because of where it lives, not because they
remembered to.

## What a note looks like

```json
{
  "title": "Express middleware order",
  "content": "notFound and errorHandler have to be added last, or they never run.",
  "tags": ["express", "node", "backend"],
  "pinned": false
}
```

The schema lowercases and trims tags, so `"React"`, `"react "` and `"react"`
all collapse into one tag and filtering behaves. Listing puts pinned notes
first, then most recently updated.

`?search=` looks through title, content and tags, case-insensitively. It
escapes regex characters before building the pattern - otherwise searching for
`c++` or a stray `(` either finds nothing or throws, depending on the
character, because the search text was being read as a pattern rather than as
text.

## Testing

36 checks against a live server and a live database, covering CRUD, search and
filters, validation, and whether two accounts can see each other's notes:

- register / login / `me`
- notes routes turning away no token, junk tokens and expired tokens
- create, read, update, pin, delete
- partial updates leaving the untouched fields alone
- tags lowercased, pinned notes sorted first, tag counts adding up
- search plain, case-insensitive, and with regex characters in it
- user B failing to list, read, update, pin or delete user A's notes - 404 each
- an `owner` field in the request body being ignored
- validation errors as 400, unknown ids as 404

All passing. `postman/notes-app.postman_collection.json` runs the same ground
by hand - it's split into Auth, Notes, "Second user - proof notes are private",
and Errors, and tokens and note ids get passed between requests automatically.

## Layout

```
src/
├── server.js                      # Express setup, mounts both routers
├── config/db.js                   # the MongoDB connection
├── models/
│   ├── User.js                    # bcrypt hashing hook, password check
│   └── Note.js                    # note schema, tag normalising, owner link
├── routes/
│   ├── authRoutes.js              # register / login / me
│   └── noteRoutes.js              # protected with router.use(protect)
├── controllers/
│   ├── authController.js          # registration, login, token signing
│   └── noteController.js          # CRUD, always scoped to req.user
└── middleware/
    ├── auth.js                    # protect - verifies the JWT
    └── errorHandler.js            # 404s and errors, as JSON
```

The auth half is the same code as assignment 2. I copied it rather than
importing it so each assignment stays runnable and markable on its own.
