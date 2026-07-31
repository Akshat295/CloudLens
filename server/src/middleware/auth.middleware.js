const { verifyToken } = require("../utils/jwt");
const { sendError } = require("../utils/apiResponse");
const User = require("../models/User");

const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return sendError(res, 401, "Unauthorized: No token provided");
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    return sendError(res, 401, "Unauthorized: No token provided");
  }

  try {
    const decoded = verifyToken(token);

    // Looking the user up (rather than trusting the payload outright) lets
    // us reject tokens from deleted accounts and tokens invalidated by
    // "logout from all devices" (tokenVersion bump), not just tokens that
    // fail signature/expiry checks.
    const user = await User.findById(decoded.userId).select("tokenVersion");

    if (!user || (decoded.tokenVersion || 0) !== user.tokenVersion) {
      return sendError(res, 401, "Unauthorized: Session has expired, please log in again");
    }

    req.user = { userId: decoded.userId };
    next();
  } catch (error) {
    return sendError(res, 401, "Unauthorized: Invalid or expired token");
  }
};

module.exports = protect;
