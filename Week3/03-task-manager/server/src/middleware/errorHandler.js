// Every failure leaves the API as JSON in the same shape.

export function notFound(req, res, next) {
  res.status(404);
  next(new Error("Route not found: " + req.method + " " + req.originalUrl));
}

export function errorHandler(err, req, res, next) {
  let status = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message;

  if (err.name === "ValidationError") {
    status = 400;
    message = Object.values(err.errors)
      .map((item) => item.message)
      .join(" ");
  }

  if (err.name === "CastError" && err.kind === "ObjectId") {
    status = 400;
    message = "'" + err.value + "' is not a valid id.";
  }

  // 11000 is MongoDB's duplicate key error - here, an email already in use.
  if (err.code === 11000) {
    status = 409;
    message = "That email address is already registered.";
  }

  res.status(status).json({
    success: false,
    message,
    stack: process.env.NODE_ENV === "production" ? undefined : err.stack,
  });
}
