const bcrypt = require("bcrypt");

const { findUserByEmail, createUser } = require("../database/user.repository");
const { generateToken } = require("../../utils/jwt");
const ApiError = require("../../utils/ApiError");
const User = require("../../models/User");

const SALT_ROUNDS = 10;

const registerUser = async ({ fullName, email, password }) => {
  const existingUser = await findUserByEmail(email);

  if (existingUser) {
    throw new ApiError(409, "Email is already registered");
  }

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  const user = await createUser({ fullName, email, password: hashedPassword });

  return user.toJSON();
};

const loginUser = async ({ email, password }) => {
  const user = await findUserByEmail(email);

  if (!user) {
    throw new ApiError(401, "Invalid email or password");
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid email or password");
  }

  const token = generateToken(user._id, user.tokenVersion);

  return { token, user: user.toJSON() };
};

// Invalidates every JWT issued before this call: each token carries the
// tokenVersion it was signed with, and protect() rejects any token whose
// version doesn't match the user's current one.
const logoutAllDevices = async (userId) => {
  const user = await User.findByIdAndUpdate(
    userId,
    { $inc: { tokenVersion: 1 } },
    { new: true }
  );

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return { loggedOutAllDevices: true };
};

module.exports = {
  registerUser,
  loginUser,
  logoutAllDevices,
};
