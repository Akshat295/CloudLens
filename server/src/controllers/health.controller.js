const healthService = require("../services/health.service");
const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/apiResponse");

const checkHealth = asyncHandler(async (req, res) => {
  const data = healthService();

  sendSuccess(res, data);
});

module.exports = {
  checkHealth,
};
