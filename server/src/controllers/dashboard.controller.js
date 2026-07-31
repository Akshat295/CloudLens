const {
  getDashboardData,
  getRecommendations,
} = require("../services/dashboard/dashboard.service");
const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/apiResponse");

const getDashboard = asyncHandler(async (req, res) => {
  const dashboard = await getDashboardData(req.user.userId);

  sendSuccess(res, dashboard);
});

const getLatestRecommendations = asyncHandler(async (req, res) => {
  const recommendations = await getRecommendations(req.user.userId);

  sendSuccess(res, recommendations);
});

module.exports = {
  getDashboard,
  getLatestRecommendations,
};
