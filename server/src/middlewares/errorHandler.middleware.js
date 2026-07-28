const { sendError } = require("../utils/apiResponse");

// Centralized error handler: must be the last middleware registered.
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  console.error(err);

  const statusCode = err.statusCode || 500;
  sendError(res, statusCode, err.message || "Internal Server Error");
};

module.exports = errorHandler;
