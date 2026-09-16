# Deploying the capstone

Three services, because the app is three things: a database, a Node server that
holds WebSockets open, and a folder of static files.

| Piece | Goes on | Why there |
|-------|---------|-----------|
| MongoDB | MongoDB Atlas | a database has to outlive the process that queries it |
| `server/` | Render | it is a long-running process, and Socket.IO needs one |
| `client/` | Vercel | `npm run build` produces static files; a CDN is the right home for them |

**Why the API is not on Vercel next to the front end.** Vercel runs serverless
functions: a process is started for a request and torn down after it. A
WebSocket is the opposite - a connection deliberately held open, with the room
membership from `realtime.js` living in that process's memory. Render runs an
ordinary always-on Node process, which is what this needs.

## The order, and why it matters

The API has to allow the front end's origin; the front end has to know the
API's URL. Neither domain exists until the thing is deployed, so there is a
loop, and it is broken by deploying the API first with the wrong `CLIENT_URL`
and coming back to fix it:

```
Atlas  →  Render (API)  →  Vercel (client)  →  back to Render: set CLIENT_URL
```

Skipping that last step is the classic symptom: the site loads, looks perfect,
and every request fails with a CORS error in the console.

---

## 1. MongoDB Atlas

1. Create a free **M0** cluster.
2. **Database Access** - add a user with a password. This is not your Atlas
   login; it is a database account, and its password goes in the connection
   string.
3. **Network Access** - allow `0.0.0.0/0`.
4. **Connect → Drivers** - copy the connection string.

It arrives looking like this, and needs two edits - the password, and a
database name before the `?`, or everything lands in a database called `test`:

```
mongodb+srv://feeduser:<password>@cluster0.xxxxx.mongodb.net/social_feed?retryWrites=true&w=majority
```

**On `0.0.0.0/0`.** That is an allow-list of every IP, which deserves a
justification rather than a shrug: Render's free tier does not give the service
a fixed outbound address, so there is no narrower range to name. What actually
keeps the database shut is the user and password, which is why that password
wants to be long and random and never committed. A paid Render instance can
have a static outbound IP, and then this list should name it and nothing else.

## 2. Render - the API

**New → Web Service**, pointed at this repository, with:

| Setting | Value |
|---------|-------|
| Root directory | `Week4/capstone/server` |
| Build command | `npm install` |
| Start command | `npm start` |
| Health check path | `/api/health` |

The root directory is the one that catches people out with a repository like
this one: it holds four weeks of coursework, so without it Render builds from
the top, finds no `package.json`, and fails.

Environment variables:

| Key | Value |
|-----|-------|
| `MONGODB_URI` | the Atlas string from step 1 |
| `JWT_SECRET` | a real one - see below |
| `JWT_EXPIRES_IN` | `7d` |
| `NODE_ENV` | `production` - see below |
| `CLIENT_URL` | `http://localhost:5176` for now; step 4 fixes it |

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

`PORT` is deliberately absent: Render sets it, and `server.js` reads it. Setting
it by hand is how you get a service that builds, starts, and is never reachable.

**`NODE_ENV` is not optional here.** The error handler withholds the stack trace
from a failed response only when it reads `production`, and Render does not set
it for you - so an unset `NODE_ENV` means any 500 answers whoever asked with a
stack trace and the absolute paths of the source files on the server. It is set
in `render.yaml` for exactly this reason.

The server refuses to boot on a missing `MONGODB_URI` or a placeholder
`JWT_SECRET`, so a misconfigured deploy fails loudly in the logs instead of
coming up broken.

When it is live, `https://your-api.onrender.com/api/health` should answer
`{"success":true,"status":"ok",...}`.

### Two things the free tier costs you

**Uploaded images do not survive.** The filesystem is ephemeral - wiped on every
deploy and every spin-down - so avatars and post images vanish while the
database rows still point at them. `UPLOAD_DIR` exists for the fix: attach a
disk (a paid feature), mount it at `/var/data/uploads`, and set `UPLOAD_DIR` to
that path. Nothing in the code changes. The properly scalable answer is object
storage - S3 or Cloudinary - with the database holding a URL rather than a
filename, which is where this would go next.

**The service sleeps after about fifteen minutes of inactivity,** and the next
request pays roughly fifty seconds to wake it. The socket layer already handles
this: `RealtimeContext` reconnects with a backoff, and the connection dot in the
navbar goes grey while it does. The REST calls just take a moment.

## 3. Vercel - the client

**Add New → Project**, same repository:

| Setting | Value |
|---------|-------|
| Root directory | `Week4/capstone/client` |
| Framework preset | Vite (detected) |
| Build command | `npm run build` |
| Output directory | `dist` |

One environment variable: `VITE_API_URL` = `https://your-api.onrender.com`,
with no trailing slash - the client concatenates paths onto it.

**`VITE_API_URL` is read at build time, not at run time.** Vite substitutes
`import.meta.env.VITE_API_URL` into the bundle during `npm run build`; there is
no process left at run time to read an environment variable. Changing it
therefore means a **redeploy**, not a restart - an easy hour to lose.

`vercel.json` is what makes `/p/:id` work on a refresh. React Router invents
those paths in the browser, so the server is asked for a file that was never
built, and the honest answer is a 404. The rewrite hands every unmatched path
`index.html` and lets the router sort it out once it loads.

## 4. Close the loop

Back in Render, set `CLIENT_URL` to the Vercel domain and redeploy:

```
CLIENT_URL=https://your-app.vercel.app,https://your-app-git-main-you.vercel.app
```

It is comma separated because Vercel gives every branch and every pull request
its own preview URL, and a preview that cannot call the API is not much of a
preview. The list is also the whole access policy - anything not named on it is
refused - so it wants the domains you actually use, not a wildcard.

The same list is handed to Socket.IO in `initRealtime`, so the REST API and the
WebSocket handshake cannot drift apart.

## Checking it actually works

1. `GET /api/health` on the API answers `ok`.
2. The site loads, and the feed renders.
3. Register an account - that exercises Atlas, CORS and JWT in one request.
4. The connection dot in the navbar goes green (the WebSocket upgraded).
5. Open it in two browsers, post from one, and watch "1 new post ↑" appear in
   the other.

When something is wrong, the console usually names it:

| Symptom | Cause |
|---------|-------|
| `blocked by CORS policy` | `CLIENT_URL` on Render does not list the Vercel domain exactly - scheme included, trailing slash excluded |
| `Cannot reach the API at http://localhost:5006` | `VITE_API_URL` was missing at build time; set it and **redeploy** |
| 404 on a refresh of `/p/:id` | `vercel.json` did not ship |
| `MongoServerError: bad auth` | the `<password>` placeholder is still in the connection string |
| First request hangs ~50s | the free instance is waking up |
| Avatars 404 after a deploy | the ephemeral filesystem, above |
