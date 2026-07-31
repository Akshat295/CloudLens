// --- HIGH: Public DB, Encryption disabled ---------------------------------
const getRDSPublicAccessRecommendation = (publiclyAccessible) => {
  if (publiclyAccessible) {
    return {
      severity: "HIGH",
      action: "REVIEW",
      confidence: 95,
      recommendation:
        "Database is publicly accessible — disable public access and connect through a VPC, bastion host, or VPN instead.",
      reason: "PubliclyAccessible is enabled on this DB instance.",
    };
  }

  return {
    severity: "LOW",
    action: "NONE",
    confidence: 99,
    recommendation: "Database is not publicly accessible.",
    reason: "PubliclyAccessible is disabled on this DB instance.",
  };
};

const getRDSEncryptionRecommendation = (storageEncrypted) => {
  if (!storageEncrypted) {
    return {
      severity: "HIGH",
      action: "REVIEW",
      confidence: 95,
      recommendation:
        "Storage encryption is disabled — enable encryption at rest (requires recreating the instance from a snapshot).",
      reason: "StorageEncrypted is false on this DB instance.",
    };
  }

  return {
    severity: "LOW",
    action: "NONE",
    confidence: 99,
    recommendation: "Storage encryption is enabled.",
    reason: "StorageEncrypted is true on this DB instance.",
  };
};

// --- MEDIUM: Backup retention too low, Single AZ, High CPU ----------------
const getRDSBackupRecommendation = ({ backupDisabled, lowBackupRetention, backupRetentionPeriod }) => {
  if (backupDisabled) {
    return {
      severity: "MEDIUM",
      action: "REVIEW",
      confidence: 90,
      recommendation: "Automated backups are disabled — enable backups with at least a 7-day retention period.",
      reason: "Backup retention period is 0 days (backups disabled).",
    };
  }

  if (lowBackupRetention) {
    return {
      severity: "MEDIUM",
      action: "REVIEW",
      confidence: 85,
      recommendation: "Backup retention period is too low — increase it to at least 7 days.",
      reason: `Backup retention period is only ${backupRetentionPeriod} day(s).`,
    };
  }

  return {
    severity: "LOW",
    action: "NONE",
    confidence: 95,
    recommendation: "Backup retention is configured appropriately.",
    reason: `Backup retention period is ${backupRetentionPeriod} day(s).`,
  };
};

const getRDSMultiAZRecommendation = (multiAZ) => {
  if (!multiAZ) {
    return {
      severity: "MEDIUM",
      action: "REVIEW",
      confidence: 80,
      recommendation: "Multi-AZ is not enabled — enable it for automatic failover and higher availability.",
      reason: "This instance is deployed in a single Availability Zone.",
    };
  }

  return {
    severity: "LOW",
    action: "NONE",
    confidence: 95,
    recommendation: "Multi-AZ is enabled.",
    reason: "This instance is deployed across multiple Availability Zones.",
  };
};

// Covers both ends of the utilization spectrum: sustained high CPU (MEDIUM,
// as specified) and very low CPU, which suggests the instance class is
// oversized for its workload — bucketed at the same MEDIUM tier since it's
// the same underlying CPU-utilization analysis, just the opposite signal.
//
// `isRunning` guards the same false-signal case fixed for EC2: a stopped RDS
// instance has no CloudWatch datapoints, so averageCPU reads as 0 — reading
// that as "idle, downsize to save X%" would be wrong since AWS isn't
// charging compute for a stopped instance in the first place.
const getRDSCPURecommendation = ({ averageCPU, isIdle, isHighCPU, isRunning = true }) => {
  if (!isRunning) {
    return {
      severity: "LOW",
      action: "NONE",
      confidence: 100,
      recommendation: "Database instance is stopped — no active compute cost.",
      reason: "Instance status is not available/running, so CPU utilization cannot be measured.",
      savingsRate: 0,
    };
  }

  if (isIdle) {
    return {
      severity: "MEDIUM",
      action: "REVIEW",
      confidence: 80,
      recommendation:
        "Database CPU utilization is very low — the instance may be oversized, consider downsizing the instance class.",
      reason: `Average CPU utilization is only ${averageCPU.toFixed(2)}%.`,
      savingsRate: 0.3,
    };
  }

  if (isHighCPU) {
    return {
      severity: "MEDIUM",
      action: "REVIEW",
      confidence: 85,
      recommendation:
        "Database CPU utilization is high — consider a larger instance class or query/index optimization.",
      reason: `Average CPU utilization is ${averageCPU.toFixed(2)}%.`,
      savingsRate: 0,
    };
  }

  return {
    severity: "LOW",
    action: "NONE",
    confidence: 95,
    recommendation: "Database CPU utilization is healthy.",
    reason: `Average CPU utilization is ${averageCPU.toFixed(2)}%.`,
    savingsRate: 0,
  };
};

// --- LOW: gp2 -> gp3, Old engine version -----------------------------------
const getRDSStorageTypeRecommendation = (isGp2) => {
  if (isGp2) {
    return {
      severity: "LOW",
      action: "REVIEW",
      confidence: 85,
      recommendation: "Storage uses gp2 — migrate to gp3 for better price/performance.",
      reason: "StorageType is gp2.",
    };
  }

  return {
    severity: "LOW",
    action: "NONE",
    confidence: 95,
    recommendation: "Storage type is optimized.",
    reason: "StorageType is not gp2.",
  };
};

const getRDSEngineVersionRecommendation = ({ engineVersionIsOld, engine, engineVersion }) => {
  if (engineVersionIsOld) {
    return {
      severity: "LOW",
      action: "REVIEW",
      confidence: 70,
      recommendation:
        "Engine version is older than the recommended baseline — plan an upgrade to a supported, more recent version.",
      reason: `${engine} ${engineVersion} is below this scanner's recommended minimum version for this engine family.`,
    };
  }

  return {
    severity: "LOW",
    action: "NONE",
    confidence: 90,
    recommendation: "Engine version is reasonably current.",
    reason: `${engine} ${engineVersion} meets this scanner's recommended minimum version.`,
  };
};

// --- Merge: exactly one Recommendation document per DB instance, matching
// the same 1-per-resource cardinality already established for EC2/S3. -----
const SEVERITY_RANK = { LOW: 1, MEDIUM: 2, HIGH: 3 };

const mergeRDSRecommendations = ({
  publicAccessRecommendation,
  encryptionRecommendation,
  backupRecommendation,
  multiAZRecommendation,
  cpuRecommendation,
  storageTypeRecommendation,
  engineVersionRecommendation,
  monthlyCost,
  estimatedSavings,
}) => {
  const parts = [
    publicAccessRecommendation,
    encryptionRecommendation,
    backupRecommendation,
    multiAZRecommendation,
    cpuRecommendation,
    storageTypeRecommendation,
    engineVersionRecommendation,
  ];

  const flagged = parts.filter((part) => part.action !== "NONE");
  const worst = parts.reduce((worstSoFar, part) =>
    SEVERITY_RANK[part.severity] > SEVERITY_RANK[worstSoFar.severity] ? part : worstSoFar
  );

  return {
    severity: worst.severity,
    action: flagged.length ? "REVIEW" : "NONE",
    confidence: worst.confidence,
    recommendation: flagged.length
      ? flagged.map((part) => part.recommendation).join(" ")
      : "Public access, encryption, backups, Multi-AZ, CPU utilization, storage type, and engine version are all healthy.",
    reason: parts.map((part) => part.reason).join(" | "),
    monthlyCost,
    estimatedSavings,
  };
};

module.exports = {
  getRDSPublicAccessRecommendation,
  getRDSEncryptionRecommendation,
  getRDSBackupRecommendation,
  getRDSMultiAZRecommendation,
  getRDSCPURecommendation,
  getRDSStorageTypeRecommendation,
  getRDSEngineVersionRecommendation,
  mergeRDSRecommendations,
};
