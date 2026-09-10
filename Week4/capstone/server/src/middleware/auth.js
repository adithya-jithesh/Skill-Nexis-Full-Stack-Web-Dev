import jwt from "jsonwebtoken";
import User from "../models/User.js";

// Guards a route. Put it in front of any handler that should only run for a
// logged-in user, and it attaches that user to req.user.
export async function protect(req, res, next) {
  const header = req.headers.authorization || "";

  // The standard way to send a token: "Authorization: Bearer <token>"
  if (!header.startsWith("Bearer ")) {
    res.status(401);
    return next(new Error("Not authorised. Send a Bearer token in the Authorization header."));
  }

  const token = header.split(" ")[1];

  try {
    // verify checks the signature and the expiry date. A token edited by
    // hand fails here, because the signature no longer matches the secret.
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    // Look the user up fresh: the token could belong to an account that has
    // since been deleted.
    const user = await User.findById(payload.id);

    if (!user) {
      res.status(401);
      return next(new Error("The user this token belongs to no longer exists."));
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401);
    const message =
      error.name === "TokenExpiredError"
        ? "Your session has expired. Please log in again."
        : "Invalid token.";
    next(new Error(message));
  }
}

// Some routes are readable by anyone but show more to someone logged in - a
// public post carries "have you liked this?" only if there is a "you". This
// attaches req.user when a valid token is sent and simply carries on when it
// is not, so one handler serves both.
export async function optionalAuth(req, res, next) {
  const header = req.headers.authorization || "";

  if (!header.startsWith("Bearer ")) return next();

  try {
    const payload = jwt.verify(header.split(" ")[1], process.env.JWT_SECRET);
    const user = await User.findById(payload.id);
    if (user) req.user = user;
  } catch {
    // A bad or expired token is treated as no token here, rather than as an
    // error: the route works either way, and the protected routes are the
    // ones that must refuse.
  }

  next();
}
