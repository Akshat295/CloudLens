// Rule-based (no LLM) generator that turns a scan's per-bucket signals —
// already computed by s3.scanner.js's processBucket, one lightweight input
// object per bucket — into short, human-readable sentences. Every rule here
// is a plain threshold/count check, deliberately mirroring the style of
// s3.recommender.js's recommenders: deterministic, and safe to explain.
const LARGE_BUCKET_GB_THRESHOLD = 100;
const STANDARD_HEAVY_PERCENT_THRESHOLD = 80;

const pluralize = (count, singular, plural = `${singular}s`) => (count === 1 ? singular : plural);
const isAre = (count) => (count === 1 ? "is" : "are");
const hasHave = (count) => (count === 1 ? "has" : "have");

const generateS3Insights = (buckets) => {
  if (!buckets.length) {
    return [
      {
        category: "GENERAL",
        severity: "INFO",
        message: "No S3 buckets were found in this scan.",
      },
    ];
  }

  const insights = [];

  // Security: public access (either via Block Public Access being off, or a
  // bucket policy that itself grants public/wildcard access).
  const publicBuckets = buckets.filter((bucket) => bucket.isPublic || bucket.publicPolicyGrant);
  if (publicBuckets.length > 0) {
    insights.push({
      category: "SECURITY",
      severity: "HIGH",
      message: `${publicBuckets.length} ${pluralize(publicBuckets.length, "bucket")} ${isAre(publicBuckets.length)} public.`,
    });
  }

  // Security: missing default encryption.
  const unencryptedBuckets = buckets.filter((bucket) => !bucket.encryptionEnabled);
  if (unencryptedBuckets.length > 0) {
    insights.push({
      category: "SECURITY",
      severity: "HIGH",
      message: `${unencryptedBuckets.length} ${pluralize(unencryptedBuckets.length, "bucket")} ${isAre(unencryptedBuckets.length)} missing encryption.`,
    });
  }

  // Lifecycle: large buckets accumulating storage with no cleanup/transition rules.
  const largeBucketsWithoutLifecycle = buckets.filter(
    (bucket) => bucket.bucketSizeGB > LARGE_BUCKET_GB_THRESHOLD && !bucket.hasLifecycleRules
  );
  if (largeBucketsWithoutLifecycle.length === 1) {
    insights.push({
      category: "LIFECYCLE",
      severity: "MEDIUM",
      message: `One bucket larger than ${LARGE_BUCKET_GB_THRESHOLD} GB has no lifecycle.`,
    });
  } else if (largeBucketsWithoutLifecycle.length > 1) {
    insights.push({
      category: "LIFECYCLE",
      severity: "MEDIUM",
      message: `${largeBucketsWithoutLifecycle.length} buckets larger than ${LARGE_BUCKET_GB_THRESHOLD} GB have no lifecycle.`,
    });
  }

  // Storage: buckets whose data is overwhelmingly still in STANDARD.
  const standardHeavyBuckets = buckets.filter(
    (bucket) => bucket.bucketSizeGB >= 1 && (bucket.standardPercent || 0) >= STANDARD_HEAVY_PERCENT_THRESHOLD
  );
  if (standardHeavyBuckets.length > 0) {
    insights.push({
      category: "STORAGE",
      severity: "MEDIUM",
      message: `${standardHeavyBuckets.length} ${pluralize(standardHeavyBuckets.length, "bucket")} ${hasHave(standardHeavyBuckets.length)} over ${STANDARD_HEAVY_PERCENT_THRESHOLD}% of its data in STANDARD storage — consider Intelligent-Tiering.`,
    });
  }

  // Storage: versioning disabled (data-loss-protection gap).
  const versioningDisabledBuckets = buckets.filter((bucket) => !bucket.versioningEnabled);
  if (versioningDisabledBuckets.length > 0) {
    insights.push({
      category: "STORAGE",
      severity: "LOW",
      message: `${versioningDisabledBuckets.length} ${pluralize(versioningDisabledBuckets.length, "bucket")} ${hasHave(versioningDisabledBuckets.length)} versioning disabled.`,
    });
  }

  // Cost: current spend, always reported.
  const totalMonthlyCost = buckets.reduce((sum, bucket) => sum + (bucket.monthlyCost || 0), 0);
  insights.push({
    category: "COST",
    severity: "INFO",
    message: `Estimated storage cost is $${totalMonthlyCost.toFixed(2)}/month.`,
  });

  // Cost: potential savings, only when there's something to act on.
  const totalEstimatedSavings = buckets.reduce((sum, bucket) => sum + (bucket.estimatedSavings || 0), 0);
  if (totalEstimatedSavings > 0) {
    insights.push({
      category: "COST",
      severity: "LOW",
      message: `Up to $${totalEstimatedSavings.toFixed(2)}/month could be saved by acting on the flagged recommendations.`,
    });
  }

  // General: a healthy scan still gets a positive signal, not silence.
  if (!publicBuckets.length && !unencryptedBuckets.length && !largeBucketsWithoutLifecycle.length) {
    insights.push({
      category: "GENERAL",
      severity: "INFO",
      message: "No public buckets, missing encryption, or unmanaged large buckets were found — S3 posture looks healthy.",
    });
  }

  return insights;
};

module.exports = {
  generateS3Insights,
};
