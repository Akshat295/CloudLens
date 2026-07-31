const Scan = require("../../models/Scan");
const Resource = require("../../models/Resource");
const Recommendation = require("../../models/Recommendation");

const getDashboardSummary = async (userId) => {
  const latestScan = await Scan.findOne({ userId }).sort({
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
        userId: latestScan.userId,
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
          userId: latestScan.userId,
        },
      },
      {
        $facet: {
          // Real infrastructure spend — stays unfiltered by status. Marking
          // a recommendation resolved/ignored is a tracking action, not an
          // AWS change, so it doesn't reduce what's actually being billed.
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

          // "Potential savings if you act on outstanding recommendations" —
          // a resolved one is already acted on, an ignored one was
          // explicitly dismissed, so neither should keep counting here.
          totalEstimatedSavings: [
            {
              $match: {
                status: "OPEN",
              },
            },
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
                status: "OPEN",
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
                status: "OPEN",
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
                status: "OPEN",
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

// Feature 9: EC2 fleet-wide stats for the dashboard's new cards (Average
// CPU/Network/Disk, Idle Instances, Old Instances, Encrypted Volumes).
// Deliberately separate from getDashboardSummary above (left untouched) —
// this reads the same latest-scan EC2 resources and reduces their metadata
// in plain JS rather than another Mongo aggregation, since a scan's EC2
// fleet is small enough that this is simpler than a $facet pipeline.
const OLD_INSTANCE_AGE_DAYS = 365;
const IDLE_CPU_THRESHOLD = 5;

const EMPTY_EC2_FLEET_STATS = {
  avgCpu: 0,
  avgNetwork: 0,
  avgDisk: 0,
  idleInstances: 0,
  oldInstances: 0,
  encryptedVolumes: 0,
  totalVolumes: 0,
};

const getEC2FleetStats = async (userId) => {
  const latestScan = await Scan.findOne({ userId }).sort({
    createdAt: -1,
  });

  if (!latestScan) return { ...EMPTY_EC2_FLEET_STATS };

  const ec2Resources = await Resource.find({
    scanId: latestScan._id,
    userId,
    resourceType: "EC2",
  });

  if (!ec2Resources.length) return { ...EMPTY_EC2_FLEET_STATS };

  let totalCpu = 0;
  let totalNetwork = 0;
  let totalDisk = 0;
  let idleInstances = 0;
  let oldInstances = 0;
  let encryptedVolumes = 0;
  let totalVolumes = 0;

  for (const resource of ec2Resources) {
    const metadata = resource.metadata || {};
    const cpu = metadata.averageCpu || 0;
    const network = (metadata.networkIn || 0) + (metadata.networkOut || 0);
    const disk = (metadata.diskReadBytes || 0) + (metadata.diskWriteBytes || 0);

    totalCpu += cpu;
    totalNetwork += network;
    totalDisk += disk;

    if (cpu < IDLE_CPU_THRESHOLD) idleInstances += 1;
    if ((metadata.instanceAgeDays || 0) > OLD_INSTANCE_AGE_DAYS) oldInstances += 1;

    const encryptedFlags = metadata.encrypted || [];
    totalVolumes += encryptedFlags.length;
    encryptedVolumes += encryptedFlags.filter(Boolean).length;
  }

  const count = ec2Resources.length;

  return {
    avgCpu: Number((totalCpu / count).toFixed(2)),
    avgNetwork: Number((totalNetwork / count).toFixed(2)),
    avgDisk: Number((totalDisk / count).toFixed(2)),
    idleInstances,
    oldInstances,
    encryptedVolumes,
    totalVolumes,
  };
};

// IAM fleet-wide stats for the dashboard's IAM Security Insights cards.
// Same approach as getEC2FleetStats above: reads the latest scan's IAM
// resources and reduces their metadata in plain JS. Users and roles are
// separate resourceTypes ("IAM_USER" / "IAM_ROLE") rather than one bucket
// disambiguated by metadata — AWS-managed service-linked roles are already
// filtered out before ever reaching MongoDB (see iam.scanner.js), so every
// IAM_ROLE resource here is customer-managed.
const EMPTY_IAM_FLEET_STATS = {
  totalUsers: 0,
  totalRoles: 0,
  mfaEnabledUsers: 0,
  adminUsers: 0,
  oldAccessKeys: 0,
  highRiskUsers: 0,
};

const getIAMFleetStats = async (userId) => {
  const latestScan = await Scan.findOne({ userId }).sort({
    createdAt: -1,
  });

  if (!latestScan) return { ...EMPTY_IAM_FLEET_STATS };

  const [userResources, roleResources] = await Promise.all([
    Resource.find({ scanId: latestScan._id, userId, resourceType: "IAM_USER" }),
    Resource.find({ scanId: latestScan._id, userId, resourceType: "IAM_ROLE" }),
  ]);

  if (!userResources.length && !roleResources.length) return { ...EMPTY_IAM_FLEET_STATS };

  let mfaEnabledUsers = 0;
  let adminUsers = 0;
  let oldAccessKeys = 0;
  let highRiskUsers = 0;

  for (const resource of userResources) {
    const metadata = resource.metadata || {};

    if (metadata.mfaEnabled) mfaEnabledUsers += 1;
    if (metadata.hasAdminAccess) adminUsers += 1;
    if (metadata.riskLevel === "HIGH") highRiskUsers += 1;
    oldAccessKeys += (metadata.accessKeys || []).filter((key) => key.isOld).length;
  }

  return {
    totalUsers: userResources.length,
    totalRoles: roleResources.length,
    mfaEnabledUsers,
    adminUsers,
    oldAccessKeys,
    highRiskUsers,
  };
};

// Counts OPEN-worthy recommendations (action !== "NONE", i.e. an actual
// finding rather than a healthy "nothing to do here" result) by category,
// for the dashboard's "Security Findings" / "Cost Findings" / etc. cards.
// Separate from getDashboardSummary's severity counts above (left
// untouched) — this is a new grouping dimension, not a replacement.
const EMPTY_CATEGORY_COUNTS = {
  securityFindings: 0,
  costFindings: 0,
  performanceFindings: 0,
  reliabilityFindings: 0,
  operationalExcellenceFindings: 0,
};

const getRecommendationCategoryCounts = async (userId) => {
  const latestScan = await Scan.findOne({ userId }).sort({
    createdAt: -1,
  });

  if (!latestScan) return { ...EMPTY_CATEGORY_COUNTS };

  const counts = await Recommendation.aggregate([
    {
      $match: {
        scanId: latestScan._id,
        userId: latestScan.userId,
        action: { $ne: "NONE" },
        status: "OPEN",
      },
    },
    {
      $group: {
        _id: "$category",
        count: { $sum: 1 },
      },
    },
  ]);

  const countByCategory = Object.fromEntries(counts.map((entry) => [entry._id, entry.count]));

  return {
    securityFindings: countByCategory.SECURITY || 0,
    costFindings: countByCategory.COST || 0,
    performanceFindings: countByCategory.PERFORMANCE || 0,
    reliabilityFindings: countByCategory.RELIABILITY || 0,
    operationalExcellenceFindings: countByCategory.OPERATIONAL_EXCELLENCE || 0,
  };
};

module.exports = {
  getDashboardSummary,
  getEC2FleetStats,
  getIAMFleetStats,
  getRecommendationCategoryCounts,
};