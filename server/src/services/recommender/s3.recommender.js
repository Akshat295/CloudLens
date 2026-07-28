const getS3Recommendation = (analysis) => {
  const { issues, isPublic } = analysis;

  if (!issues.length) {
    return {
      severity: "LOW",
      action: "NONE",
      confidence: 99,
      recommendation: "Bucket configuration is healthy.",
      reason:
        "No public access, versioning is enabled, and a lifecycle policy is configured.",
    };
  }

  return {
    severity: isPublic ? "HIGH" : "MEDIUM",
    action: "REVIEW",
    confidence: 90,
    recommendation: "Bucket has configuration issues that should be reviewed.",
    reason: issues.join("; "),
  };
};

// Encryption gets its own recommendation (kept separate from
// getS3Recommendation above) since it has its own independent severity
// ladder — HIGH when missing, LOW either way once enabled — rather than
// being folded into the aggregate public/versioning/lifecycle issue list.
const getS3EncryptionRecommendation = ({ encryptionEnabled, encryptionType }) => {
  if (!encryptionEnabled || encryptionType === "None") {
    return {
      severity: "HIGH",
      action: "REVIEW",
      confidence: 95,
      recommendation: "Enable default server-side encryption on this bucket.",
      reason:
        "No default server-side encryption is configured, so objects are stored unencrypted at rest.",
    };
  }

  if (encryptionType === "aws:kms") {
    return {
      severity: "LOW",
      action: "NONE",
      confidence: 99,
      recommendation: "Default encryption (AWS KMS) is enabled.",
      reason:
        "Server-side encryption using AWS KMS is configured, providing managed keys and audit logging.",
    };
  }

  return {
    severity: "LOW",
    action: "NONE",
    confidence: 99,
    recommendation: "Default encryption (AES256) is enabled.",
    reason: "Server-side encryption using AES256 (SSE-S3) is configured.",
  };
};

// Illustrative, clearly-heuristic thresholds for what counts as a "large" vs
// "very small" bucket for the storage-shape checks below.
const LARGE_BUCKET_THRESHOLD_GB = 100;
const SMALL_BUCKET_THRESHOLD_GB = 1;

// Storage gets its own recommendation (kept separate from
// getS3Recommendation/getS3EncryptionRecommendation above) since it's driven
// entirely by usage shape (size/object count/lifecycle/tiering/replication)
// rather than security configuration, and it's the only one of the three
// that carries a real dollar cost/savings figure. `savingsRate` (0-1) is a
// judgment call left for the caller to turn into a dollar amount via
// storage.calculator.js's calculateS3EstimatedSavings, keeping this function
// free of pricing math.
const getS3StorageRecommendation = ({
  bucketSizeGB,
  objectCount,
  hasLifecycleRules,
  hasIntelligentTiering,
  hasReplication,
}) => {
  const sizeSummary = `${bucketSizeGB.toFixed(2)} GB across ${objectCount.toLocaleString()} objects`;

  if (bucketSizeGB >= LARGE_BUCKET_THRESHOLD_GB && !hasLifecycleRules) {
    return {
      severity: "HIGH",
      action: "REVIEW",
      confidence: 85,
      recommendation:
        "Large bucket without a lifecycle policy — add rules to transition or expire aging data.",
      reason: `This bucket holds ${sizeSummary} with no lifecycle policy, so storage costs will keep growing unchecked.`,
      savingsRate: 0.3,
    };
  }

  if (bucketSizeGB >= LARGE_BUCKET_THRESHOLD_GB && !hasIntelligentTiering) {
    return {
      severity: "MEDIUM",
      action: "REVIEW",
      confidence: 75,
      recommendation:
        "Large bucket without Intelligent-Tiering — enable it to automatically move infrequently accessed data to cheaper tiers.",
      reason: `This bucket holds ${sizeSummary} and its lifecycle rules don't transition data into S3 Intelligent-Tiering.`,
      savingsRate: 0.2,
    };
  }

  if (bucketSizeGB < SMALL_BUCKET_THRESHOLD_GB && hasReplication) {
    return {
      severity: "LOW",
      action: "REVIEW",
      confidence: 70,
      recommendation:
        "Very small bucket with replication configured — review whether replication is still needed.",
      reason: `This bucket is only ${sizeSummary} but replicates every object to another destination, roughly doubling its storage cost for little benefit at this scale.`,
      savingsRate: 1,
    };
  }

  return {
    severity: "LOW",
    action: "NONE",
    confidence: 95,
    recommendation: "Bucket storage is optimized.",
    reason: `This bucket holds ${sizeSummary} with an appropriate lifecycle/tiering configuration for its size.`,
    savingsRate: 0,
  };
};

// Bucket-policy findings get their own recommendation (kept separate from
// getS3Recommendation, which only looks at Block Public Access/versioning/
// lifecycle, not policy *content*) since a policy can grant public/wildcard
// access even when Block Public Access is fully enabled at the bucket
// level for ACLs. Picks the single worst applicable finding, mirroring how
// getS3Recommendation already picks one severity from multiple issues.
const getS3PolicyRecommendation = ({
  policyExists,
  hasWildcardPrincipal,
  publicRead,
  publicWrite,
  fullAccess,
  wildcardPermissions,
  issues,
}) => {
  if (publicRead || publicWrite || fullAccess) {
    const grants = fullAccess
      ? ["full access"]
      : [publicRead && "public read (GetObject)", publicWrite && "public write (PutObject)"].filter(Boolean);

    return {
      severity: "HIGH",
      action: "REVIEW",
      confidence: 97,
      recommendation: `Bucket policy grants ${grants.join(" and ")} to everyone — restrict the policy's Principal immediately.`,
      reason: issues.join("; "),
    };
  }

  if (hasWildcardPrincipal || wildcardPermissions) {
    return {
      severity: "MEDIUM",
      action: "REVIEW",
      confidence: 85,
      recommendation:
        "Bucket policy contains a wildcard principal or wildcard permissions — narrow it to specific principals/actions.",
      reason: issues.join("; "),
    };
  }

  if (!policyExists) {
    return {
      severity: "LOW",
      action: "NONE",
      confidence: 90,
      recommendation: "No bucket policy is configured.",
      reason:
        "Access is governed solely by IAM and any Block Public Access settings; a bucket policy is optional but can add an explicit layer of control.",
    };
  }

  return {
    severity: "LOW",
    action: "NONE",
    confidence: 95,
    recommendation: "Bucket policy is scoped appropriately.",
    reason: "The bucket policy does not grant wildcard or public access.",
  };
};

// Bucket size above which having no lifecycle policy at all is flagged HIGH
// (deliberately lower/more specific than getS3StorageRecommendation's own
// 100 GB "large bucket" threshold, which is about overall storage-sizing
// posture rather than lifecycle content specifically).
const LARGE_BUCKET_LIFECYCLE_THRESHOLD_GB = 20;

// Inspects the *content* of a bucket's lifecycle rules (via
// s3.analyzer.js's analyzeLifecycleRules) rather than just whether a
// lifecycle configuration exists at all. Kept separate from
// getS3StorageRecommendation, which only checks presence/intelligent-tiering
// as one factor among several usage-shape checks.
const getS3LifecycleRecommendation = ({ bucketSizeGB, lifecycleAnalysis }) => {
  const {
    configured,
    ruleCount,
    hasTransitionToIA,
    hasTransitionToGlacier,
    hasIntelligentTiering,
    hasExpirationRule,
    hasAbortIncompleteMultipartUpload,
    onlyExpirationConfigured,
  } = lifecycleAnalysis;

  const hasAnyTransition = hasTransitionToIA || hasTransitionToGlacier || hasIntelligentTiering;

  if (!configured) {
    if (bucketSizeGB > LARGE_BUCKET_LIFECYCLE_THRESHOLD_GB) {
      return {
        severity: "HIGH",
        action: "REVIEW",
        confidence: 90,
        recommendation:
          "No lifecycle policy is configured — add rules to transition aging data and control storage growth.",
        reason: `This bucket is ${bucketSizeGB.toFixed(2)} GB, above the ${LARGE_BUCKET_LIFECYCLE_THRESHOLD_GB} GB threshold, with no lifecycle rules at all.`,
      };
    }

    return {
      severity: "LOW",
      action: "NONE",
      confidence: 80,
      recommendation: "No lifecycle policy is configured, but the bucket is small enough for this to be low priority.",
      reason: `This bucket is only ${bucketSizeGB.toFixed(2)} GB, below the ${LARGE_BUCKET_LIFECYCLE_THRESHOLD_GB} GB threshold used to flag a missing lifecycle policy.`,
    };
  }

  if (onlyExpirationConfigured) {
    return {
      severity: "MEDIUM",
      action: "REVIEW",
      confidence: 85,
      recommendation:
        "Lifecycle rules only expire objects — add storage-class transitions (Standard-IA/Glacier) to reduce costs before deletion.",
      reason: `${ruleCount} lifecycle rule(s) configured, but none transition objects to a cheaper storage class or clean up incomplete multipart uploads.`,
    };
  }

  if (!hasAnyTransition && !hasAbortIncompleteMultipartUpload) {
    // Configured, but not doing anything useful yet (e.g. disabled rules,
    // or filters that never actually transition/expire/clean up anything).
    return {
      severity: "MEDIUM",
      action: "REVIEW",
      confidence: 70,
      recommendation:
        "Lifecycle rules are configured but don't transition, expire, or clean up incomplete uploads — review whether they're active.",
      reason: `${ruleCount} lifecycle rule(s) configured, none of which include a storage-class transition, expiration, or multipart-upload cleanup.`,
    };
  }

  const configuredFeatures = [
    hasTransitionToIA && "transitions to Standard-IA",
    hasTransitionToGlacier && "transitions to Glacier",
    hasIntelligentTiering && "transitions to Intelligent-Tiering",
    hasExpirationRule && "expiration rules",
    hasAbortIncompleteMultipartUpload && "incomplete multipart upload cleanup",
  ].filter(Boolean);

  return {
    severity: "LOW",
    action: "NONE",
    confidence: 95,
    recommendation: "Lifecycle policy is properly configured.",
    reason: `${ruleCount} lifecycle rule(s) configured with ${configuredFeatures.join(", ")}.`,
  };
};

// Thresholds for the storage-class distribution check below. A bucket
// under 1 GB of tracked storage is exempt — percentages on a handful of MB
// aren't meaningful and would just be noise.
const STANDARD_DOMINANT_THRESHOLD_PERCENT = 80;
const ARCHIVE_CANDIDATE_THRESHOLD_PERCENT = 10;
const MIN_TRACKED_GB_FOR_DISTRIBUTION_CHECK = 1;
const BYTES_PER_GB = 1024 ** 3;

// Looks at how a bucket's bytes are actually spread across storage classes
// (via s3.analyzer.js's analyzeStorageClassDistribution) rather than just
// its total size. Two independent signals, either or both of which can
// fire: most of the bucket still sitting in STANDARD (suggest Intelligent-
// Tiering), and data that's already confirmed cold (in an IA tier) with
// nothing yet moved to Glacier (suggest a further transition there).
const getS3StorageClassRecommendation = ({ percentages, totalBytes }) => {
  const totalGB = totalBytes / BYTES_PER_GB;

  if (totalGB < MIN_TRACKED_GB_FOR_DISTRIBUTION_CHECK) {
    return {
      severity: "LOW",
      action: "NONE",
      confidence: 60,
      recommendation: "Bucket is too small for storage-class distribution to be meaningful.",
      reason: `Tracked storage classes total only ${totalGB.toFixed(3)} GB.`,
    };
  }

  const standardPercent = percentages.STANDARD || 0;
  const iaPercent = (percentages.STANDARD_IA || 0) + (percentages.ONEZONE_IA || 0);
  const archivedPercent = (percentages.GLACIER || 0) + (percentages.DEEP_ARCHIVE || 0);

  const suggestions = [];

  if (standardPercent >= STANDARD_DOMINANT_THRESHOLD_PERCENT) {
    suggestions.push(
      `${standardPercent}% of this bucket's tracked storage is in STANDARD — enable S3 Intelligent-Tiering so infrequently accessed objects move to cheaper tiers automatically.`
    );
  }

  if (iaPercent >= ARCHIVE_CANDIDATE_THRESHOLD_PERCENT && archivedPercent === 0) {
    suggestions.push(
      `${iaPercent.toFixed(2)}% of storage is already in an Infrequent Access tier with none in Glacier — data that's been cold this long is a good candidate for a further transition to Glacier/Deep Archive.`
    );
  }

  const distributionSummary = `STANDARD: ${standardPercent}%, STANDARD_IA: ${percentages.STANDARD_IA || 0}%, ONEZONE_IA: ${percentages.ONEZONE_IA || 0}%, GLACIER: ${percentages.GLACIER || 0}%, DEEP_ARCHIVE: ${percentages.DEEP_ARCHIVE || 0}%.`;

  if (!suggestions.length) {
    return {
      severity: "LOW",
      action: "NONE",
      confidence: 90,
      recommendation: "Storage class distribution is well optimized.",
      reason: distributionSummary,
    };
  }

  return {
    severity: "MEDIUM",
    action: "REVIEW",
    confidence: 80,
    recommendation: suggestions.join(" "),
    reason: distributionSummary,
  };
};

const SEVERITY_RANK = { HIGH: 3, MEDIUM: 2, LOW: 1 };

// EC2 saves exactly one Recommendation per instance per scan (see
// ec2.scanner.js's processInstance). The checks above each produce their
// own assessment, but saving each as a separate Recommendation document
// meant a single bucket showed up multiple times per scan in any UI that
// lists recommendations — unlike an EC2 instance, which always shows up
// once. This merges them into the one Recommendation actually saved for a
// bucket, restoring that same one-resource-one-recommendation shape:
// severity is the worst of all of them, the recommendation/reason text
// combines whichever checks actually flagged something, and only the
// storage check's dollar figures are carried through (it's the only one
// with real cost data).
const mergeS3Recommendations = ({
  configRecommendation,
  encryptionRecommendation,
  storageRecommendation,
  policyRecommendation,
  lifecycleRecommendation,
  storageClassRecommendation,
  monthlyCost,
  estimatedSavings,
}) => {
  const parts = [
    configRecommendation,
    encryptionRecommendation,
    storageRecommendation,
    policyRecommendation,
    lifecycleRecommendation,
    storageClassRecommendation,
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
      : "Bucket configuration, encryption, storage, lifecycle, storage-class distribution, and policy are all healthy.",
    reason: parts.map((part) => part.reason).join(" | "),
    monthlyCost,
    estimatedSavings,
  };
};

module.exports = {
  getS3Recommendation,
  getS3EncryptionRecommendation,
  getS3StorageRecommendation,
  getS3PolicyRecommendation,
  getS3LifecycleRecommendation,
  getS3StorageClassRecommendation,
  mergeS3Recommendations,
};
