const Scan = require("../../models/Scan");
const Resource = require("../../models/Resource");
const Recommendation = require("../../models/Recommendation");

const getDashboardSummary = async () => {
  const latestScan = await Scan.findOne().sort({
    createdAt: -1,
  });

  if (!latestScan) {
    return {
      totalResources: 0,
      runningResources: 0,
      stoppedResources: 0,
      monthlyCost: 0,
      estimatedSavings: 0,
      highRecommendations: 0,
      mediumRecommendations: 0,
      lowRecommendations: 0,
    };
  }

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

  const resources = resourceStats[0];
  const recommendations =
    recommendationStats[0];

  return {
    totalResources:
      resources.totalResources[0]?.count || 0,

    runningResources:
      resources.runningResources[0]?.count || 0,

    stoppedResources:
      resources.stoppedResources[0]?.count || 0,

    monthlyCost:
      recommendations.totalMonthlyCost[0]
        ?.total || 0,

    estimatedSavings:
      recommendations
        .totalEstimatedSavings[0]?.total || 0,

    highRecommendations:
      recommendations.highRecommendations[0]
        ?.count || 0,

    mediumRecommendations:
      recommendations
        .mediumRecommendations[0]?.count || 0,

    lowRecommendations:
      recommendations.lowRecommendations[0]
        ?.count || 0,
  };
};

module.exports = {
  getDashboardSummary,
};