# Notes App Frontend

A React front end for the [notes backend](../03-notes-app-backend). It logs in,
holds on to the JWT, and sends it with every request so the backend knows whose
notes to hand back. Built with Vite and React 19, plain CSS, same theme as the
Week 1 apps.

This is the piece that turns the mini project into something you can use
without Postman.

## What it does

- Sign up or log in, with the API's own error messages shown on the form
- Write, edit, pin and delete notes
- Search as you type, and filter by tag - both done by the API, not in the browser
- A tag list built from `/api/notes/tags`, showing how often each tag is used
- Stays logged in across a refresh, and drops you back to the login screen if
  the token expires

## Running it

The backend has to be running first:

```bash
cd Week2/03-notes-app-backend
npm install && npm run dev          # http://localhost:5002
```

Then, in a second terminal:

```bash
cd Week2/04-notes-app-frontend
npm install
cp .env.example .env
npm run dev                          # http://localhost:5173
```

`VITE_API_URL` in `.env` says where the backend is. Vite only exposes variables
beginning with `VITE_` to browser code, which is why the name looks like that.

## How it talks to the backend

Everything goes through `src/api.js`, so no component ever calls `fetch`
itself. It attaches the token, turns a failed response into a thrown `Error`
carrying the API's message, and says something useful when the backend simply
is not running.

```
login  ->  { token, user }  ->  saved in localStorage and in App state
                            ->  sent as: Authorization: Bearer <token>
```

The token lives in `localStorage`, so a refresh does not log you out. If a
request ever comes back `401` - an expired or rejected token - `App` clears the
session and shows the login screen with "Your session has expired."

## Where the state lives

`App.jsx` owns everything the whole app cares about: the token, the user, the
notes, the search text and the active tag. Components below it take props and
call back up.

| Component | What it does |
|-----------|--------------|
| `AuthForm` | Log in / sign up. One form, two modes, its own typed values |
| `Header`   | Title, who is logged in, note count, log out |
| `NoteForm` | Writes a new note, and doubles as the editor for an existing one |
| `NoteCard` | One note, with edit / pin / delete. No state of its own |
| `Sidebar`  | Search box and the tag list from the API |
| `Footer`   | Presentational only |

Searching and filtering are **not** done in the browser. Changing either one
re-asks the API, which is what the `?search=` and `?tag=` query parameters on
the backend are for. That means filtering keeps working no matter how many
notes exist, because the database does the work.

`NoteForm` is where `useEffect` genuinely earns its place: when App hands it a
note to edit, the form has to load that note into its boxes, because the state
it shows has to follow a prop that changed somewhere else.

## Checked in a browser

Signed up, wrote a note, and confirmed against the running API:

- Tags typed as `Express, Security, JWT` came back `#express #security #jwt` -
  the backend lowercases them
- The tag sidebar filled in with counts from the aggregation endpoint
- Pinning moved the note to the top and gave it the accent border and badge
- Searching `salts` narrowed three notes to one, and the header count followed
- A full page refresh kept the session
- No console errors or React warnings
