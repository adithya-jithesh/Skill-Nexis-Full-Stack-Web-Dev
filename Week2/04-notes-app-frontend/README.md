# Notes App Frontend

A React front end for the [notes backend](../03-notes-app-backend). It logs in,
hangs on to the JWT, and sends it with every request so the API knows whose
notes to hand over. Vite and React 19, plain CSS, same theme as the Week 1 apps.

This is the bit that makes the mini project usable without Postman. Week 2
didn't ask for it.

## What you can do with it

Sign up or log in - the API's own error messages get shown on the form rather
than being swallowed. Write notes, edit them, pin them, delete them. Search as
you type, filter by tag. The tag list comes from `/api/notes/tags` and shows
how often each one is used.

It keeps you logged in across a refresh, and drops you back at the login screen
if the token expires.

## Running it

The backend needs to be up first:

```bash
cd Week2/03-notes-app-backend
npm install && npm run dev          # http://localhost:5002
```

Then in another terminal:

```bash
cd Week2/04-notes-app-frontend
npm install
cp .env.example .env
npm run dev                          # http://localhost:5173
```

`VITE_API_URL` in `.env` says where the backend is. The prefix isn't
decoration - Vite only exposes variables starting with `VITE_` to browser
code, which is a sensible default given everything in `.env` would otherwise
end up in the bundle.

## Talking to the API

Everything goes through `src/api.js`, so no component ever calls `fetch`
itself. It attaches the token, turns a failed response into a thrown `Error`
carrying whatever the API said, and gives a useful message when the backend
just isn't running - which is the error you actually hit most while developing.

Logging in returns `{ token, user }`. The token goes into `localStorage` and
into App state, and from then on rides along as `Authorization: Bearer <token>`.
`localStorage` is what stops a refresh logging you out. If anything ever comes
back 401 - expired, or rejected - `App` clears the session and shows the login
screen with "Your session has expired."

## Where state lives

`App.jsx` owns everything the app as a whole cares about: token, user, notes,
search text, active tag. Everything below takes props and calls back up.

| Component | What it does |
|-----------|--------------|
| `AuthForm` | Log in / sign up. One form, two modes, holds what's typed |
| `Header`   | Title, who's logged in, note count, log out |
| `NoteForm` | Writes a new note, and doubles as the editor for an existing one |
| `NoteCard` | One note, with edit / pin / delete. No state of its own |
| `Sidebar`  | Search box and the tag list from the API |
| `Footer`   | Presentational |

Search and tag filtering aren't done in the browser. Changing either re-asks
the API, which is what `?search=` and `?tag=` on the backend were built for.
Filtering a local copy would have been less code, but it stops scaling the
moment there are more notes than you'd want to ship to the browser at once.

`NoteForm` is the one place `useEffect` genuinely earns its keep: when App
hands it a note to edit, the form has to load that note into its boxes,
because what it's showing has to follow a prop that changed elsewhere.

## Checked in a browser

Signed up, wrote a note, and watched what the API did with it:

- tags typed as `Express, Security, JWT` came back `#express #security #jwt`,
  so the backend's lowercasing works end to end
- the tag sidebar filled in with counts from the aggregation endpoint
- pinning moved the note to the top and gave it the accent border and badge
- searching `salts` cut three notes down to one, and the header count followed
- a full refresh kept the session
- no console errors, no React warnings
