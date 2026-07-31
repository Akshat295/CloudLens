const express = require("express");

const router = express.Router();

const { signup, login, logoutAll } = require("../controllers/auth.controller");
const protect = require("../middleware/auth.middleware");
const { loginRateLimiter } = require("../middleware/rateLimiter.middleware");

router.post("/signup", signup);
router.post("/login", loginRateLimiter, login);

// Requires a valid current token — logging out everywhere also logs out the
// device that made this request, which is the expected behavior.
router.post("/logout-all", protect, logoutAll);

module.exports = router;
