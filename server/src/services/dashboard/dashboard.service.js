const {
  getDashboardSummary,
  getEC2FleetStats,
  getIAMFleetStats,
  getRecommendationCategoryCounts,
} = require("../database/dashboard.repository");

const {
  getLatestRecommendations,
} = require("../database/recommendation.repository");

const {
  getLatestInsights,
} = require("../database/insight.repository");

// getDashboardSummary's own aggregation (EC2-era resource/recommendation
// counts) is left completely untouched — insights, the EC2/IAM fleet
// stats, and the category breakdown are all fetched separately and merged
// in here, so the existing dashboard fields/behavior don't change for
// anything that isn't reading these new fields.
const getDashboardData = async () => {
  const [summary, insights, ec2Stats, iamStats, categoryStats] = await Promise.all([
    getDashboardSummary(),
    getLatestInsights(),
    getEC2FleetStats(),
    getIAMFleetStats(),
    getRecommendationCategoryCounts(),
  ]);

  return { ...summary, insights, ec2Stats, iamStats, categoryStats };
};

const getRecommendations = async () => {
  return await getLatestRecommendations();
};

module.exports = {
  getDashboardData,
  getRecommendations,
};
