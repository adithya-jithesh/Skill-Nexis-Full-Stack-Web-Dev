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
