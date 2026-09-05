# Assignment 2 - User Authentication API

Registration and login on Express and MongoDB. Passwords get hashed with
bcrypt before they're stored, and registering or logging in hands back a JSON
Web Token that opens the protected route.

| Method | Endpoint | Token needed | What it does |
|--------|----------|--------------|--------------|
| GET | `/` | no | Health check |
| POST | `/api/auth/register` | no | Create an account, returns a JWT |
| POST | `/api/auth/login` | no | Log in, returns a JWT |
| GET | `/api/auth/me` | yes | Whoever the token belongs to |

The token goes in a header: `Authorization: Bearer <token>`

## Running it

```bash
cd Week2/02-auth-api
npm install
cp .env.example .env
# generate a real secret and paste it into .env:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
npm run dev
```

Port 5001, so it can sit next to assignment 1 on 5000. The server won't start
while `JWT_SECRET` is still the placeholder from `.env.example` - it felt worth
failing loudly there rather than signing tokens with a secret that's published
in the repo.

`.env` holds four things: `PORT`, `MONGODB_URI` (local Mongo or an Atlas
string), `JWT_SECRET`, and `JWT_EXPIRES_IN`, which defaults to `7d`. Anyone
holding the secret can forge a token for any account, so it doesn't get
committed.

## What happens to the password

It only exists in plain form for the length of the request. A `pre("save")`
hook on the User model hashes it before it can reach MongoDB:

```
"supersecret123"  ->  bcrypt.genSalt(10)  ->  bcrypt.hash
                  ->  $2b$10$cVpBJGhxDkwlfHZMDu0ncOXNZCEzt...
```

The salt is random per user, so two people who pick the same password still end
up with completely different hashes - which is what stops someone precomputing
a table of common passwords and matching it against the whole database at once.

Ten rounds makes the hash deliberately slow. You don't notice it on one login,
but it's what makes guessing millions of passwords expensive.

Hashing only goes one way, so logging in doesn't decrypt anything. bcrypt
re-hashes whatever was typed using the same salt and compares the two results.
And the field is `select: false` on the schema, so the hash stays out of query
results unless something asks for it by name - only `login` does.

## What happens to the token

`register` and `login` sign a token carrying nothing but the user's id.
`protect`, in `src/middleware/auth.js`, runs ahead of any guarded route: it
reads the header, verifies the signature and expiry, looks that user up, and
hangs them on `req.user`.

Worth being clear that a JWT is signed, not encrypted. Anyone can read the
payload:

```
payload: {"id":"6a95820ce61a4266fb30da28","iat":1788183052,"exp":1788787852}
```

What they can't do is change it. Edit one character and the signature no longer
matches, so `jwt.verify` throws it out - they'd need the secret to sign a new
one. That's the reason nothing sensitive goes in a payload.

## Decisions I'd point at

Login gives the same message for a wrong password as for an email that doesn't
exist ("Invalid email or password"). Two different messages would turn the
login form into a way of checking which addresses are registered.

The schema lowercases emails, so `Adi@x.com` and `adi@x.com` can't quietly
become two separate accounts.

Every protected request looks the user up in the database rather than trusting
the token on its own. Slightly more work per request, but a token for a
deleted account stops working immediately.

Expiry gets its own message ("Your session has expired") because that one is
the user's problem to fix by logging in again, not a sign anything is broken.

## What's been tested

| Case | Comes back |
|------|------------|
| Register | `201` + token |
| Register with an email already in use | `409` |
| Password under 8 characters | `400` |
| Login with the right password | `200` + token |
| Login with a wrong password, or an unknown email | `401` |
| `/me` with a valid token | `200` |
| `/me` with no token, junk, or a token signed with a different secret | `401` |
| `/me` with an expired token | `401`, "Your session has expired" |

`postman/auth-api.postman_collection.json` runs all of these. Register and
login save the token into `{{token}}`, so the protected request just works.

## Layout

```
src/
├── server.js                      # Express setup, refuses to boot on a placeholder secret
├── config/db.js                   # the MongoDB connection
├── models/User.js                 # schema, hashing hook, password comparison
├── routes/authRoutes.js           # register / login / me
├── controllers/authController.js  # the endpoints, and token signing
└── middleware/
    ├── auth.js                    # protect - verifies the JWT
    └── errorHandler.js            # 404s and errors, as JSON
```
