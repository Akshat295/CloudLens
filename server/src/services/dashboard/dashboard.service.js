const {
  getDashboardSummary,
} = require("../database/dashboard.repository");

const {
  getLatestRecommendations,
} = require("../database/recommendation.repository");

const getDashboardData = async () => {
  return await getDashboardSummary();
};

const getRecommendations = async () => {
  return await getLatestRecommendations();
};

module.exports = {
  getDashboardData,
  getRecommendations,
};