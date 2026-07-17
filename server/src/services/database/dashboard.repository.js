const Resource = require("../../models/Resource");
const Scan = require("../../models/Scan");
const Recommendation = require("../../models/Recommendation");
const getDashboardSummary = async () => {
  // Get latest scan
  const latestScan = await Scan.findOne().sort({
    createdAt: -1,
  });

  if (!latestScan) {
    return {
      totalResources: 0,
      runningResources: 0,
      stoppedResources: 0,
    };
  }

  // Aggregate resource statistics
  const resourceStats = await Resource.aggregate([
    {
      $match: {
        scanId: latestScan._id,
      },
    },
    {
      $facet: {
        totalResources: [
          {
            $count: "count",
          },
        ],

        runningResources: [
          {
            $match: {
              state: "running",
            },
          },
          {
            $count: "count",
          },
        ],

        stoppedResources: [
          {
            $match: {
              state: "stopped",
            },
          },
          {
            $count: "count",
          },
        ],
      },
    },
  ]);

  const recommendationStats =
  await Recommendation.aggregate([
    {
      $match: {
        scanId: latestScan._id,
      },
    },
    {
      $facet: {
        totalMonthlyCost: [
          {
            $group: {
              _id: null,
              total: {
                $sum: "$monthlyCost",
              },
            },
          },
        ],

        totalEstimatedSavings: [
          {
            $group: {
              _id: null,
              total: {
                $sum: "$estimatedSavings",
              },
            },
          },
        ],

        highRecommendations: [
          {
            $match: {
              severity: "HIGH",
            },
          },
          {
            $count: "count",
          },
        ],

        mediumRecommendations: [
          {
            $match: {
              severity: "MEDIUM",
            },
          },
          {
            $count: "count",
          },
        ],

        lowRecommendations: [
          {
            $match: {
              severity: "LOW",
            },
          },
          {
            $count: "count",
          },
        ],
      },
    },
  ]);

  console.log(
    JSON.stringify(resourceStats, null, 2)
  );

  console.log(
  JSON.stringify(recommendationStats, null, 2)
);

  return {
  totalResources:
    resourceStats[0].totalResources[0]?.count || 0,

  runningResources:
    resourceStats[0].runningResources[0]?.count || 0,

  stoppedResources:
    resourceStats[0].stoppedResources[0]?.count || 0,

  monthlyCost:
    recommendationStats[0]
      .totalMonthlyCost[0]?.total || 0,

  estimatedSavings:
    recommendationStats[0]
      .totalEstimatedSavings[0]?.total || 0,

  highRecommendations:
    recommendationStats[0]
      .highRecommendations[0]?.count || 0,

  mediumRecommendations:
    recommendationStats[0]
      .mediumRecommendations[0]?.count || 0,

  lowRecommendations:
    recommendationStats[0]
      .lowRecommendations[0]?.count || 0,
};
};

module.exports = {
  getDashboardSummary,
};