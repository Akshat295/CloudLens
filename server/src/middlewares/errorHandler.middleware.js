const { sendError } = require("../utils/apiResponse");

// Centralized error handler: must be the last middleware registered.
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  console.error(err);

  // Mongoose schema validation failures (missing/malformed required fields).
  if (err.name === "ValidationError") {
    const message = Object.values(err.errors)
      .map((fieldError) => fieldError.message)
      .join(", ");
    return sendError(res, 400, message);
  }

  // Malformed ObjectId in a route param (e.g. GET /api/scans/not-an-id).
  if (err.name === "CastError") {
    return sendError(res, 400, `Invalid ${err.path}`);
  }

  // Unique-index collision — the app already pre-checks for known cases
  // (duplicate email, duplicate AWS connection), this is the safety net for
  // the race-condition window between that check and the actual write.
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || "value";
    return sendError(res, 409, `A record with this ${field} already exists`);
  }

  const statusCode = err.statusCode || 500;
  // Unclassified errors (statusCode 500) may carry internal details
  // (DB/driver messages, stack info in err.message) that shouldn't reach
  // the client — those are already logged above via console.error.
  const message = statusCode === 500 ? "Internal Server Error" : err.message;

  sendError(res, statusCode, message);
};

module.exports = errorHandler;
