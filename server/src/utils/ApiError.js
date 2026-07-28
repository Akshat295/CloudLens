// Lets services/controllers throw an error carrying an explicit HTTP status,
// which the centralized error middleware then honors instead of always returning 500.
class ApiError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
  }
}

module.exports = ApiError;
