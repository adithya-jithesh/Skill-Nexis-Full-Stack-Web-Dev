# Assignment 2 - User Authentication API

Registration and login built with Express and MongoDB. Passwords are hashed
with bcrypt before they are stored, and a successful register or login hands
back a JSON Web Token that unlocks the protected route.

## What it does

| Method | Endpoint | Protected | Does |
|--------|----------|-----------|------|
| GET | `/` | no | Health check |
| POST | `/api/auth/register` | no | Create an account, returns a JWT |
| POST | `/api/auth/login` | no | Log in, returns a JWT |
| GET | `/api/auth/me` | **yes** | The account the token belongs to |

Send the token as a header: `Authorization: Bearer <token>`

## Running it

```bash
cd Week2/02-auth-api
npm install
cp .env.example .env
# put a real secret in .env:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
npm run dev
```

Runs on <http://localhost:5001>, so it can sit alongside assignment 1 on 5000.
The server refuses to start while `JWT_SECRET` is still the placeholder.

### Environment variables

| Variable | Default | What it is |
|----------|---------|------------|
| `PORT` | `5001` | Port the API listens on |
| `MONGODB_URI` | `mongodb://127.0.0.1:27017/auth_api` | Local MongoDB, or an Atlas string |
| `JWT_SECRET` | *(none)* | Signs and verifies tokens. Anyone holding it can forge a token for any account |
| `JWT_EXPIRES_IN` | `7d` | How long a token stays valid |

## How the password is handled

The plain password exists only for the length of the request. A `pre("save")`
hook on the User model hashes it before it ever reaches MongoDB:

```
"supersecret123"  ->  bcrypt.genSalt(10)  ->  bcrypt.hash
                  ->  $2b$10$cVpBJGhxDkwlfHZMDu0ncOXNZCEzt...
```

- The **salt is random per user**, so two people who pick the same password
  still get completely different hashes.
- **10 rounds** means the hash is deliberately slow. That barely matters for
  one login, but it makes guessing millions of passwords expensive.
- Hashing is **one way**. Logging in does not decrypt anything - bcrypt
  re-hashes what was typed, with the same salt, and compares the results.
- The field is `select: false` on the schema, so the hash is left out of
  every query unless it is asked for by name. Only `login` asks for it.

## How the JWT is handled

`register` and `login` sign a token holding just the user's id. `protect`
(in `src/middleware/auth.js`) runs before any guarded route: it reads the
`Authorization` header, verifies the signature and expiry, loads that user
from the database and hangs them on `req.user`.

A JWT is **signed, not encrypted** - anyone can read the payload:

```
payload: {"id":"6a95820ce61a4266fb30da28","iat":1788183052,"exp":1788787852}
```

What they cannot do is change it. Editing a single character breaks the
signature and `jwt.verify` rejects it, because they do not have the secret.
That is why no password or secret ever goes in a token payload.

## Deliberate choices worth pointing out

- **Login says the same thing for a wrong password and an unknown email**
  ("Invalid email or password"). Different messages would let someone probe
  which email addresses have accounts.
- **Emails are lowercased** by the schema, so `Adi@x.com` and `adi@x.com`
  cannot become two accounts.
- **The user is looked up on every protected request**, not trusted from the
  token alone, so a token for a deleted account stops working.
- **Expiry has its own message** ("Your session has expired") because that
  one is the user's problem to fix by logging in again, not a broken token.

## Tested responses

| Case | Status |
|------|--------|
| Register | `201` + token |
| Register with an email already in use | `409` |
| Password shorter than 8 characters | `400` |
| Login, correct password | `200` + token |
| Login, wrong password or unknown email | `401` |
| `/me` with a valid token | `200` |
| `/me` with no token, a garbage token, or a token signed with another secret | `401` |
| `/me` with an expired token | `401` "Your session has expired" |

Import `postman/auth-api.postman_collection.json` to run these yourself. The
Register and Login requests save the token into a `{{token}}` variable, so the
protected request works with nothing to copy across.

## How the code is organised

```
src/
├── server.js                      # Express setup, refuses to start on a placeholder secret
├── config/db.js                   # the MongoDB connection
├── models/User.js                 # schema, bcrypt hashing hook, password comparison
├── routes/authRoutes.js           # register / login / me
├── controllers/authController.js  # what each endpoint does, and token signing
└── middleware/
    ├── auth.js                    # protect - verifies the JWT
    └── errorHandler.js            # 404s and errors, as JSON
```
