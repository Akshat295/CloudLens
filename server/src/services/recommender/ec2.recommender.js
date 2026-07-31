const { calculateEC2ConfidenceScore } = require("../analyzer/ec2.analyzer");

const IDLE_CPU_THRESHOLD = 5;
const HIGH_CPU_THRESHOLD = 80;

// Same classification/thresholds/messages as before — only the confidence
// value changed, from fixed 95/90/99 constants to the weighted score
// (Feature 7). `averageCPU` stays a plain number; the extra signals are
// optional so nothing else calling this with just CPU data breaks.
//
// `isRunning` guards against a false "STOP to save $X" verdict: a stopped
// instance has no CloudWatch datapoints, so averageCPU resolves to 0 (see
// cpu.analyzer.js) — indistinguishable from "running but idle" unless the
// actual instance state is checked first. AWS doesn't bill compute time on
// a stopped instance, so there's no cost left to "save" by stopping it
// again.
const getEC2Recommendation = ({
  averageCPU,
  avgNetworkIn = 0,
  avgNetworkOut = 0,
  diskTotal = 0,
  instanceAgeDays = 0,
  isRunning = true,
}) => {
  if (!isRunning) {
    return {
      severity: "LOW",
      action: "NONE",
      confidence: 100,
      recommendation: "Instance is already stopped — no active compute cost.",
      reason: "Instance state is not running, so CPU utilization cannot be measured.",
    };
  }

  const confidence = calculateEC2ConfidenceScore({
    averageCPU,
    avgNetworkTotal: avgNetworkIn + avgNetworkOut,
    avgDiskTotal: diskTotal,
    instanceAgeDays,
  });

  if (averageCPU < IDLE_CPU_THRESHOLD) {
    return {
      severity: "HIGH",

      action: "STOP",

      confidence,

      recommendation:
        "Instance is underutilized. Consider stopping or downsizing it.",

      reason: `Average CPU utilization is only ${averageCPU.toFixed(
        2
      )}%`,
    };
  }

  if (averageCPU > HIGH_CPU_THRESHOLD) {
    return {
      severity: "MEDIUM",

      action: "UPSIZE",

      confidence,

      recommendation:
        "Instance is heavily utilized. Consider upgrading the instance type.",

      reason: `Average CPU utilization is ${averageCPU.toFixed(
        2
      )}%`,
    };
  }

  return {
    severity: "LOW",

    action: "NONE",

    confidence,

    recommendation:
      "Instance utilization is healthy.",

    reason: `Average CPU utilization is ${averageCPU.toFixed(
      2
    )}%`,
  };
};

// --- Feature 1: Network Utilization -----------------------------------
const LOW_NETWORK_BYTES_THRESHOLD = 1_000_000; // ~1MB/hr average — negligible traffic
const HIGH_NETWORK_BYTES_THRESHOLD = 50_000_000; // ~50MB/hr average — meaningfully active

const getNetworkRecommendation = ({ averageCPU, avgNetworkIn, avgNetworkOut, isRunning = true }) => {
  const totalNetwork = avgNetworkIn + avgNetworkOut;

  // Same root cause as getEC2Recommendation's isRunning guard: a stopped
  // instance has no CloudWatch data, so every one of these "idle" checks
  // would fire for a reason that has nothing to do with actual utilization.
  if (!isRunning) {
    return {
      severity: "LOW",
      action: "NONE",
      confidence: 100,
      recommendation: "Network utilization is healthy.",
      reason: "Instance is stopped — no network activity to measure.",
    };
  }

  if (averageCPU < IDLE_CPU_THRESHOLD && totalNetwork < LOW_NETWORK_BYTES_THRESHOLD) {
    return {
      severity: "HIGH",
      action: "REVIEW",
      confidence: 90,
      recommendation: "Instance appears completely idle.",
      reason: `Average CPU is ${averageCPU.toFixed(2)}% with only ${Math.round(totalNetwork)} bytes/hr of network traffic.`,
    };
  }

  if (averageCPU < IDLE_CPU_THRESHOLD && totalNetwork > HIGH_NETWORK_BYTES_THRESHOLD) {
    return {
      severity: "MEDIUM",
      action: "REVIEW",
      confidence: 75,
      recommendation: "Consider a network optimized instance.",
      reason: `Average CPU is ${averageCPU.toFixed(2)}% but network traffic averages ${Math.round(totalNetwork)} bytes/hr.`,
    };
  }

  return {
    severity: "LOW",
    action: "NONE",
    confidence: 100,
    recommendation: "Network utilization is healthy.",
    reason: `Average network traffic is ${Math.round(totalNetwork)} bytes/hr.`,
  };
};

// --- Feature 2: Disk I/O Analysis ---------------------------------------
const LOW_DISK_BYTES_THRESHOLD = 1_000_000;
const HIGH_DISK_OPS_THRESHOLD = 1000;

const getDiskRecommendation = ({ averageCPU, avgNetworkIn, avgNetworkOut, diskAnalysis, isRunning = true }) => {
  const totalNetwork = avgNetworkIn + avgNetworkOut;
  const totalDiskBytes = diskAnalysis.avgDiskReadBytes + diskAnalysis.avgDiskWriteBytes;
  const totalDiskOps = diskAnalysis.avgDiskReadOps + diskAnalysis.avgDiskWriteOps;

  if (!isRunning) {
    return {
      severity: "LOW",
      action: "NONE",
      confidence: 100,
      recommendation: "Disk I/O is healthy.",
      reason: "Instance is stopped — no disk activity to measure.",
    };
  }

  if (
    averageCPU < IDLE_CPU_THRESHOLD &&
    totalDiskBytes < LOW_DISK_BYTES_THRESHOLD &&
    totalNetwork < LOW_NETWORK_BYTES_THRESHOLD
  ) {
    return {
      severity: "HIGH",
      action: "REVIEW",
      confidence: 90,
      recommendation: "Instance is almost unused.",
      reason: `CPU, disk (${Math.round(totalDiskBytes)} bytes/hr), and network activity are all negligible.`,
    };
  }

  if (totalDiskOps > HIGH_DISK_OPS_THRESHOLD) {
    return {
      severity: "MEDIUM",
      action: "REVIEW",
      confidence: 80,
      recommendation: "Recommend storage optimized instances.",
      reason: `Average disk operations are ${Math.round(totalDiskOps)} ops/hr.`,
    };
  }

  return {
    severity: "LOW",
    action: "NONE",
    confidence: 100,
    recommendation: "Disk I/O is healthy.",
    reason: `Average disk operations are ${Math.round(totalDiskOps)} ops/hr.`,
  };
};

// --- Feature 3: Instance Age ---------------------------------------------
const OLD_INSTANCE_AGE_DAYS = 365;

const getInstanceAgeRecommendation = (instanceAgeDays) => {
  if (instanceAgeDays > OLD_INSTANCE_AGE_DAYS) {
    return {
      severity: "LOW",
      action: "REVIEW",
      confidence: 100,
      recommendation: "Instance has been running for more than 365 days — review for modernization.",
      reason: `Instance age is ${instanceAgeDays} days.`,
    };
  }

  return {
    severity: "LOW",
    action: "NONE",
    confidence: 100,
    recommendation: "Instance age is within a healthy range.",
    reason: `Instance age is ${instanceAgeDays} days.`,
  };
};

// --- Feature 4: Security Groups -------------------------------------------
const MAX_SECURITY_GROUPS = 5;

const getSecurityGroupRecommendation = ({ count, hasDefault }) => {
  if (count > MAX_SECURITY_GROUPS) {
    return {
      severity: "HIGH",
      action: "REVIEW",
      confidence: 85,
      recommendation: "Instance has more than 5 security groups attached — consider consolidating rules.",
      reason: `${count} security groups are attached.`,
    };
  }

  if (hasDefault) {
    return {
      severity: "MEDIUM",
      action: "REVIEW",
      confidence: 80,
      recommendation: "Default security group is attached — consider using a dedicated, least-privilege group.",
      reason: "The default security group is attached to this instance.",
    };
  }

  return {
    severity: "LOW",
    action: "NONE",
    confidence: 100,
    recommendation: "Security group configuration looks healthy.",
    reason: `${count} security group(s) attached, no default group in use.`,
  };
};

// --- Feature 5: EBS Information --------------------------------------------
const getEBSRecommendation = ({ hasUnencrypted, hasGp2 }) => {
  if (hasUnencrypted) {
    return {
      severity: "HIGH",
      action: "REVIEW",
      confidence: 95,
      recommendation: "One or more attached EBS volumes are unencrypted.",
      reason: "At least one attached volume has encryption disabled.",
    };
  }

  if (hasGp2) {
    return {
      severity: "LOW",
      action: "REVIEW",
      confidence: 85,
      recommendation: "gp2 volume detected — consider migrating to gp3 for better price/performance.",
      reason: "At least one attached volume uses the gp2 volume type.",
    };
  }

  return {
    severity: "LOW",
    action: "NONE",
    confidence: 100,
    recommendation: "Attached EBS volumes are healthy.",
    reason: "All attached volumes are encrypted and none use gp2.",
  };
};

// --- Feature 6: Elastic IP Detection ---------------------------------------
const getElasticIPRecommendation = (elasticIpStatus) => {
  if (elasticIpStatus === "TEMPORARY") {
    return {
      severity: "LOW",
      action: "REVIEW",
      confidence: 80,
      recommendation: "Temporary public IP detected. Suggest allocating an Elastic IP if a permanent endpoint is required.",
      reason: "Instance has an auto-assigned public IP that is not backed by an Elastic IP allocation.",
    };
  }

  return {
    severity: "LOW",
    action: "NONE",
    confidence: 100,
    recommendation: "Public IP configuration is healthy.",
    reason: `Elastic IP status: ${elasticIpStatus}.`,
  };
};

// --- Merge: exactly one Recommendation document per instance, matching the
// existing 1-per-resource cardinality (and the fix already applied to S3). ---
const SEVERITY_RANK = { LOW: 1, MEDIUM: 2, HIGH: 3 };

const mergeEC2Recommendations = ({
  baseRecommendation,
  networkRecommendation,
  diskRecommendation,
  ageRecommendation,
  securityGroupRecommendation,
  ebsRecommendation,
  elasticIpRecommendation,
  monthlyCost,
  estimatedSavings,
}) => {
  const addOns = [
    networkRecommendation,
    diskRecommendation,
    ageRecommendation,
    securityGroupRecommendation,
    ebsRecommendation,
    elasticIpRecommendation,
  ];
  const parts = [baseRecommendation, ...addOns];

  const flagged = parts.filter((part) => part.action !== "NONE");
  const worst = parts.reduce((worstSoFar, part) =>
    SEVERITY_RANK[part.severity] > SEVERITY_RANK[worstSoFar.severity] ? part : worstSoFar
  );

  // The base CPU verdict (STOP/UPSIZE) always wins so the existing "Stop
  // Instance" button (gated on action === "STOP") keeps working exactly as
  // before — add-on findings can only escalate severity/messaging, never
  // hijack a destructive action.
  const addOnsFlagged = addOns.some((part) => part.action !== "NONE");
  const action =
    baseRecommendation.action !== "NONE"
      ? baseRecommendation.action
      : addOnsFlagged
        ? "REVIEW"
        : "NONE";

  return {
    severity: worst.severity,
    action,
    confidence: baseRecommendation.confidence,
    recommendation: flagged.length
      ? flagged.map((part) => part.recommendation).join(" ")
      : "Instance CPU, network, disk, age, security groups, and storage are all healthy.",
    reason: parts.map((part) => part.reason).join(" | "),
    monthlyCost,
    estimatedSavings,
  };
};

module.exports = {
  getEC2Recommendation,
  getNetworkRecommendation,
  getDiskRecommendation,
  getInstanceAgeRecommendation,
  getSecurityGroupRecommendation,
  getEBSRecommendation,
  getElasticIPRecommendation,
  mergeEC2Recommendations,
};
