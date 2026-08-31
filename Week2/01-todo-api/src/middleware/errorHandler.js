// Anything that goes wrong ends up here, so every failure leaves the API
// as the same shape of JSON instead of an HTML stack trace.

// Hit when no route matched the URL.
export function notFound(req, res, next) {
  res.status(404);
  next(new Error("Route not found: " + req.method + " " + req.originalUrl));
}

// Express 5 sends rejected promises here on its own, so the controllers
// do not need try/catch around every await.
export function errorHandler(err, req, res, next) {
  let status = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message;

  // Mongoose validation failed (empty title, bad priority, and so on).
  if (err.name === "ValidationError") {
    status = 400;
    message = Object.values(err.errors)
      .map((item) => item.message)
      .join(" ");
  }

  // An id in the URL that is not a valid MongoDB ObjectId.
  if (err.name === "CastError" && err.kind === "ObjectId") {
    status = 400;
    message = "'" + err.value + "' is not a valid id.";
  }

  res.status(status).json({
    success: false,
    message,
    // The stack is useful while developing but should not be public.
    stack: process.env.NODE_ENV === "production" ? undefined : err.stack,
  });
}
