# Week 3 mini project - Task Manager

A task tracking app: sign in, add tasks, move them through **to do → doing →
done**, and filter the board by status, priority, tag, text or due date. React
in front, Express behind, MongoDB underneath - and the week's two assignments
folded in, since this needs both the full stack wiring and the file upload.

```
03-task-manager/
├── server/     Express + MongoDB + Multer, port 5005
│   └── uploads/    avatars (gitignored)
└── client/     React + Vite, port 5175
```

## Running it

MongoDB has to be running first. Two terminals:

```bash
# terminal 1
cd Week3/03-task-manager/server
npm install
cp .env.example .env      # then put a real JWT_SECRET in it
npm run dev               # http://localhost:5005

# terminal 2
cd Week3/03-task-manager/client
npm install
cp .env.example .env
npm run dev               # http://localhost:5175
```

The server refuses to start while `JWT_SECRET` is still the placeholder:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## The API

| Method | Route | What it does |
|--------|-------|--------------|
| POST | `/api/auth/register` | create an account, returns a JWT |
| POST | `/api/auth/login` | log in, returns a JWT |
| GET | `/api/auth/me` | the account the token belongs to |
| PUT | `/api/auth/me` | change your display name |
| POST | `/api/auth/me/avatar` | upload an avatar (`multipart/form-data`, field `avatar`) |
| GET | `/api/tasks` | your tasks - see the filters below |
| GET | `/api/tasks/stats` | counts by status, plus overdue and due today |
| GET | `/api/tasks/tags` | your tags, with counts |
| GET | `/api/tasks/:id` | one task |
| POST | `/api/tasks` | create |
| PUT | `/api/tasks/:id` | update |
| PATCH | `/api/tasks/:id/status` | move it to todo, doing or done |
| DELETE | `/api/tasks/:id` | delete |

Everything under `/api/tasks` needs `Authorization: Bearer <token>`.

**The filters** on `GET /api/tasks`:

| Parameter | Values |
|-----------|--------|
| `status` | `todo` `doing` `done` |
| `priority` | `low` `medium` `high` |
| `tag` | any tag you have used |
| `search` | matches the title, description and tags |
| `due` | `overdue` `today` `week` `none` |
| `sort` | `created` `updated` `title` `due` |
| `page`, `limit` | paging - 20 a page by default, 100 at most |

`postman/task-manager.postman_collection.json` has all 44 requests, chained so
nothing has to be copied by hand. The avatar upload needs a file picked in
Postman itself (Body > form-data), since a collection cannot carry one.

## How it is put together

**Three states, not a checkbox.** A to-do is done or it is not. A task manager
needs a middle: something started but unfinished. So `status` is an enum of
`todo`, `doing` and `done`, and moving between them has its own endpoint -
`PATCH /api/tasks/:id/status`. The board does that constantly, and a whole PUT
would mean sending the entire task back to change one word.

**Filtering, sorting and paging all happen in MongoDB.** `buildFilter()` turns
the query string into a filter object, and the list route uses it twice: once
for the page of tasks and once for `countDocuments`, so the client knows how
many pages there are. Only four sorts are allowed by name - handing the query
string to `sort()` would let a client sort by any field, including ones with no
index - and `limit` is clamped to 100, so `?limit=100000` cannot ask the server
for everything at once.

**The date filters exclude finished work.** Overdue, due today and due this week
all add `status: { $ne: "done" }`, because a list of what needs attention should
not be full of things already finished. They compare against midnight this
morning rather than the moment the request arrived, so a task due today does not
become overdue at 00:01.

**The counts come from the database.** `/api/tasks/stats` is a `$group` on
status plus two `countDocuments` calls, run together. The list on screen is both
filtered and paginated, so counting it in the browser would be wrong twice over.
The pipeline only returns statuses that actually occur, so the controller starts
from `{ todo: 0, doing: 0, done: 0 }` and fills in what came back - otherwise a
board with nothing finished would have no `done` key at all.

**The filters live in the URL.** The board keeps them in the query string with
`useSearchParams` rather than in `useState`. That makes a filtered board a link:
it can be bookmarked, shared and reloaded, and the back button steps back
through the filters instead of leaving the page. Defaults are left out of the
URL, so an unfiltered board has a clean address. Any change also resets to page
1 - staying on page 3 of a list that now has one page would show nothing.

**The stat tiles are buttons.** Clicking "Overdue" filters the board to the
overdue tasks, and the tile highlights while that filter is on. It is the
shortest route from "3 overdue" to seeing which three.

**Tasks belong to somebody.** Every query filters on `owner` as well as `_id`,
and the owner comes from the token, never the request body. Another account's
task returns **404, not 403** - a 403 would confirm it exists.

**The avatar is assignment 2, reused.** Same Multer setup, with the limit
dropped to 1 MB, and `protect` runs before it so an upload from a stranger is
refused before anything is written to disk. Replacing an avatar deletes the old
file, so ten changes do not leave ten files; a failed save deletes the new one
rather than leaving it orphaned. The avatars are served as ordinary static
files - the filename is 32 random hex characters, which is not guessable, and
putting them behind the token would mean every `<img>` needed a header.

**One form for adding and editing.** `TaskForm` starts empty on the board and
full on the detail page. Editing and adding differ only in what the form starts
out holding, so they are the same component.

**The session is restored, not assumed.** The token is kept in `localStorage`,
but a saved token can be expired or belong to a deleted account, so the auth
context asks `/api/auth/me` once on load and the route guard waits for that
answer instead of redirecting. Without that wait, a refresh would throw a
logged-in user back to the login page. A 401 from anywhere ends the session,
handled once in the axios interceptor.

## Checks

67 automated checks against a live server, database and disk, with two
accounts:

- registering, logging in, the identical message for a wrong password and an
  unknown email, changing the display name
- uploading an avatar, fetching it back and comparing its length, replacing it
  and confirming the old file is deleted, and the refusals - a non-image, a file
  over 1 MB, an upload with no token
- creating, reading, updating and deleting tasks, tags being lowercased and
  trimmed, an empty due date clearing the date instead of failing the cast, and
  the validation failures (short title, status outside the enum)
- every filter, the four sorts, an unknown sort falling back rather than
  failing, paging with no overlap between pages, a clamped limit, the tag counts
  and all six stats
- the second account failing to read, update, move or delete the first
  account's task, and seeing zeros in its own stats

All 67 pass.
