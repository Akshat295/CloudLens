// Wraps an async route handler so rejected promises are forwarded to Express'
// error-handling middleware instead of requiring a try/catch in every controller.
const asyncHandler = (handler) => (req, res, next) => {
  Promise.resolve(handler(req, res, next)).catch(next);
};

module.exports = asyncHandler;
