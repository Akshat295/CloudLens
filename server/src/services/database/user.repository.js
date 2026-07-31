const User = require("../../models/User");

const findUserByEmail = async (email) => {
  return await User.findOne({ email });
};

const findUserById = async (userId) => {
  return await User.findById(userId);
};

const createUser = async (userData) => {
  return await User.create(userData);
};

module.exports = {
  findUserByEmail,
  findUserById,
  createUser,
};
