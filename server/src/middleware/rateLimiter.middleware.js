const rateLimit = require("express-rate-limit");
const { sendError } = require("../utils/apiResponse");

// Slows down brute-force/credential-stuffing attempts against login without
// affecting normal usage — 10 attempts per IP per 15 minutes is generous for
// a real user who mistypes a password a few times.
const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    sendError(res, 429, "Too many login attempts. Please try again in a few minutes.");
  },
});

module.exports = { loginRateLimiter };
