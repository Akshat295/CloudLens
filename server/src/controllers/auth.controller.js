const { registerUser, loginUser, logoutAllDevices } = require("../services/auth/auth.service");
const { recordAuditLog } = require("../services/auditLog/auditLog.service");
const { AUDIT_ACTIONS } = require("../constants/auditActions");
const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/apiResponse");
const ApiError = require("../utils/ApiError");
const { isValidEmail, isValidPassword, isValidFullName } = require("../utils/validators");

const signup = asyncHandler(async (req, res) => {
  const { fullName, email, password } = req.body;

  if (!fullName || !email || !password) {
    throw new ApiError(400, "Full name, email and password are required");
  }

  if (!isValidFullName(fullName)) {
    throw new ApiError(400, "Full name must be between 2 and 100 characters");
  }

  if (!isValidEmail(email)) {
    throw new ApiError(400, "Please provide a valid email address");
  }

  if (!isValidPassword(password)) {
    throw new ApiError(400, "Password must be at least 8 characters and include a letter and a number");
  }

  const user = await registerUser({
    fullName: fullName.trim(),
    email: email.trim().toLowerCase(),
    password,
  });

  res.status(201).json({
    success: true,
    user,
  });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "Email and password are required");
  }

  if (!isValidEmail(email)) {
    throw new ApiError(400, "Please provide a valid email address");
  }

  const { token, user } = await loginUser({
    email: email.trim().toLowerCase(),
    password,
  });

  await recordAuditLog(user._id, AUDIT_ACTIONS.USER_LOGIN, `${user.email} logged in`);

  res.status(200).json({
    success: true,
    token,
    user,
  });
});

const logoutAll = asyncHandler(async (req, res) => {
  await logoutAllDevices(req.user.userId);

  sendSuccess(res, { loggedOutAllDevices: true });
});

module.exports = {
  signup,
  login,
  logoutAll,
};
