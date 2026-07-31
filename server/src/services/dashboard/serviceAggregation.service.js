const Scan = require("../../models/Scan");
const { getResourcesByScanId } = require("../database/resource.repository");
const { getRecommendationsByScanId } = require("../database/recommendation.repository");

// Every current resourceType is either a bare service name ("EC2", "S3",
// "RDS") or "<SERVICE>_<SUBTYPE>" ("IAM_USER", "IAM_ROLE",
// "IAM_ROOT_ACCOUNT") — taking the text before the first underscore groups
// all of those under one "IAM" service with zero special-casing, and the
// same rule keeps working for any future resourceType a new scanner
// introduces (e.g. "EBS_VOLUME" -> "EBS", "LAMBDA" -> "LAMBDA") without any
// code change here.
const getServiceName = (resourceType) => (resourceType || "UNKNOWN").split("_")[0];

const IDLE_CPU_THRESHOLD = 5;

const pluralize = (count, singular, plural = `${singular}s`) => (count === 1 ? singular : plural);
const isAre = (count) => (count === 1 ? "is" : "are");
const hasHave = (count) => (count === 1 ? "has" : "have");

const EMPTY_SEVERITY_SUMMARY = { critical: 0, high: 0, medium: 0, low: 0, healthy: 0 };

// Recommendation.severity only ever holds LOW/MEDIUM/HIGH — there's no
// CRITICAL level in the schema, and adding one would mean touching every
// scanner's recommendation logic. Instead "critical" is derived from
// existing fields: a HIGH severity finding in the SECURITY category (an
// exposed/misconfigured resource) is treated as more urgent than a HIGH
// finding in any other category (e.g. an oversized EC2 instance).
// "Healthy" reuses the same action === "NONE" convention
// getRecommendationCategoryCounts already relies on elsewhere in this file's
// sibling module — a recommendation with no action is a clean bill of
// health for that resource, not an actionable finding.
//
// Both this and buildSeveritySummary only count status === "OPEN"
// recommendations — a resolved or ignored one is no longer outstanding
// work, so it shouldn't keep inflating "how many issues need attention".
const buildServiceSummary = (resources, recommendations) => {
  const services = new Map();

  const getEntry = (service) => {
    if (!services.has(service)) {
      services.set(service, { service, resourceCount: 0, recommendationCount: 0, estimatedSavings: 0 });
    }
    return services.get(service);
  };

  resources.forEach((resource) => {
    getEntry(getServiceName(resource.resourceType)).resourceCount += 1;
  });

  recommendations.forEach((rec) => {
    if (rec.action === "NONE" || rec.status !== "OPEN") return;

    const entry = getEntry(getServiceName(rec.resourceType));
    entry.recommendationCount += 1;
    entry.estimatedSavings += rec.estimatedSavings || 0;
  });

  return Array.from(services.values())
    .map((entry) => ({ ...entry, estimatedSavings: Number(entry.estimatedSavings.toFixed(2)) }))
    .sort((a, b) => b.resourceCount - a.resourceCount);
};

const buildSeveritySummary = (recommendations) => {
  const summary = { ...EMPTY_SEVERITY_SUMMARY };

  recommendations
    .filter((rec) => rec.status === "OPEN")
    .forEach((rec) => {
      if (rec.action === "NONE") {
        summary.healthy += 1;
      } else if (rec.severity === "HIGH") {
        if (rec.category === "SECURITY") summary.critical += 1;
        else summary.high += 1;
      } else if (rec.severity === "MEDIUM") {
        summary.medium += 1;
      } else if (rec.severity === "LOW") {
        summary.low += 1;
      }
    });

  return summary;
};

// Every service present in the latest scan's resources gets an entry, even
// when it has no priced recommendations (e.g. IAM) — satisfies "if a
// service has no pricing, show cost = 0" without hardcoding which services
// those are.
const buildCostBreakdown = (resources, recommendations) => {
  const costByService = new Map();

  resources.forEach((resource) => {
    const service = getServiceName(resource.resourceType);
    if (!costByService.has(service)) costByService.set(service, 0);
  });

  recommendations.forEach((rec) => {
    const service = getServiceName(rec.resourceType);
    costByService.set(service, (costByService.get(service) || 0) + (rec.monthlyCost || 0));
  });

  return Array.from(costByService.entries())
    .map(([service, cost]) => ({ service, cost: Number(cost.toFixed(2)) }))
    .sort((a, b) => b.cost - a.cost);
};

const buildResourceDistribution = (resources) => {
  const counts = new Map();

  resources.forEach((resource) => {
    const service = getServiceName(resource.resourceType);
    counts.set(service, (counts.get(service) || 0) + 1);
  });

  return Array.from(counts.entries())
    .map(([service, count]) => ({ service, count }))
    .sort((a, b) => b.count - a.count);
};

// Descending sort by estimatedSavings already puts every zero-savings
// (but still actionable) recommendation last, as a natural side effect —
// no separate "push to the end" step needed. Resolved/ignored recommendations
// are excluded — they're no longer opportunities, they're closed items.
const buildSavingsOpportunities = (recommendations, limit = 10) => {
  return recommendations
    .filter((rec) => rec.action !== "NONE" && rec.status === "OPEN")
    .slice()
    .sort((a, b) => (b.estimatedSavings || 0) - (a.estimatedSavings || 0))
    .slice(0, limit)
    .map((rec) => ({
      resource: rec.resourceName || rec.resourceId,
      service: getServiceName(rec.resourceType),
      savings: rec.estimatedSavings || 0,
      recommendation: rec.recommendation,
    }));
};

// Declarative rule set — each rule owns one resource-level predicate and its
// own message. Adding a rule for a future service is one entry here; a
// future service with NO rule still isn't invisible, because the generic
// fallback loop below covers it automatically.
const INSIGHT_RULES = [
  {
    service: "EC2",
    // A stopped instance has no CloudWatch datapoints, so averageCpu reads 0
    // — indistinguishable from "running but idle" unless the actual state is
    // checked first. Without this, every stopped instance would permanently
    // show up as "underutilized" here regardless of how clean it actually is
    // (same root cause already fixed in ec2.recommender.js's isRunning guard).
    match: (resource) => resource.state === "running" && (resource.metadata?.averageCpu ?? 100) < IDLE_CPU_THRESHOLD,
    message: (count) => `${count} underutilized EC2 ${pluralize(count, "instance")} detected.`,
    severity: "MEDIUM",
  },
  {
    service: "IAM",
    match: (resource) => Boolean(resource.metadata?.hasAdminAccess),
    message: (count) => `${count} IAM ${pluralize(count, "user")} ${hasHave(count)} excessive permissions.`,
    severity: "HIGH",
  },
  {
    service: "RDS",
    // Same false-signal fix as EC2 above — a stopped DB instance has no CPU
    // data, so it isn't "low utilization", it's just off.
    match: (resource) => resource.state === "available" && (resource.metadata?.averageCpu ?? 100) < IDLE_CPU_THRESHOLD,
    message: (count) => `${count} RDS ${pluralize(count, "instance")} ${hasHave(count)} low utilization.`,
    severity: "MEDIUM",
  },
  {
    service: "S3",
    match: (resource) => resource.metadata?.hasLifecycleRules === false,
    message: (count) => `${count} S3 ${pluralize(count, "bucket")} ${isAre(count)} missing lifecycle rules.`,
    severity: "LOW",
  },
];

const buildAiInsights = (resources, recommendations, serviceSummary) => {
  const insights = [];
  const coveredServices = new Set();

  INSIGHT_RULES.forEach((rule) => {
    const matches = resources.filter((resource) => getServiceName(resource.resourceType) === rule.service && rule.match(resource));

    if (matches.length > 0) {
      insights.push({ message: rule.message(matches.length), severity: rule.severity });
      coveredServices.add(rule.service);
    }
  });

  // Generic catch-all: any service with actionable recommendations that
  // none of the rules above already reported on — this is what makes a
  // brand new service produce an insight with zero code changes here.
  serviceSummary.forEach((entry) => {
    if (!coveredServices.has(entry.service) && entry.recommendationCount > 0) {
      insights.push({
        message: `${entry.recommendationCount} ${entry.service} ${pluralize(entry.recommendationCount, "recommendation")} ${
          entry.recommendationCount === 1 ? "requires" : "require"
        } review.`,
        severity: "MEDIUM",
      });
    }
  });

  if (!insights.length) {
    insights.push({ message: "No issues detected — your infrastructure looks well optimized.", severity: "INFO" });
  }

  const totalSavings = recommendations.reduce((sum, rec) => sum + (rec.estimatedSavings || 0), 0);
  insights.push({ message: `Estimated monthly savings: $${totalSavings.toFixed(2)}.`, severity: "INFO" });

  return insights;
};

const EMPTY_GENERIC_INSIGHTS = {
  serviceSummary: [],
  severitySummary: { ...EMPTY_SEVERITY_SUMMARY },
  costBreakdown: [],
  resourceDistribution: [],
  savingsOpportunities: [],
  aiInsights: [],
};

// Single entry point: fetches the latest scan's resources + recommendations
// once, then derives every generic dashboard field from that same pair —
// avoids six separate DB round-trips for what is fundamentally one dataset
// viewed six ways.
const getGenericDashboardInsights = async (userId) => {
  const latestScan = await Scan.findOne({ userId }).sort({ createdAt: -1 });

  if (!latestScan) return { ...EMPTY_GENERIC_INSIGHTS };

  const [resources, recommendations] = await Promise.all([
    getResourcesByScanId(latestScan._id, userId),
    getRecommendationsByScanId(latestScan._id, userId),
  ]);

  const serviceSummary = buildServiceSummary(resources, recommendations);

  return {
    serviceSummary,
    severitySummary: buildSeveritySummary(recommendations),
    costBreakdown: buildCostBreakdown(resources, recommendations),
    resourceDistribution: buildResourceDistribution(resources),
    savingsOpportunities: buildSavingsOpportunities(recommendations),
    aiInsights: buildAiInsights(resources, recommendations, serviceSummary),
  };
};

module.exports = {
  getGenericDashboardInsights,
  getServiceName,
};
