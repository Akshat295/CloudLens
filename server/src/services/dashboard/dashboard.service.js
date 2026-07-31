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

const { getGenericDashboardInsights } = require("./serviceAggregation.service");

// getDashboardSummary's own aggregation (EC2-era resource/recommendation
// counts) is left completely untouched — insights, the EC2/IAM fleet
// stats, and the category breakdown are all fetched separately and merged
// in here, so the existing dashboard fields/behavior don't change for
// anything that isn't reading these new fields. getGenericDashboardInsights
// adds the service-agnostic fields (serviceSummary, severitySummary,
// costBreakdown, resourceDistribution, savingsOpportunities, aiInsights)
// the same way — merged in, nothing above it touched.
const getDashboardData = async (userId) => {
  const [summary, insights, ec2Stats, iamStats, categoryStats, genericInsights] = await Promise.all([
    getDashboardSummary(userId),
    getLatestInsights(userId),
    getEC2FleetStats(userId),
    getIAMFleetStats(userId),
    getRecommendationCategoryCounts(userId),
    getGenericDashboardInsights(userId),
  ]);

  return { ...summary, insights, ec2Stats, iamStats, categoryStats, ...genericInsights };
};

const getRecommendations = async (userId) => {
  return await getLatestRecommendations(userId);
};

module.exports = {
  getDashboardData,
  getRecommendations,
};
