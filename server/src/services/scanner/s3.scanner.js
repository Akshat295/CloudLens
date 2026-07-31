const {
  getBuckets,
  getBucketRegion,
  isBucketPublic,
  isVersioningEnabled,
  getLifecycleRules,
  getBucketEncryption,
  hasReplicationConfigured,
  getBucketPolicy,
} = require("../aws/s3.service");

const { getS3StorageMetrics } = require("../aws/cloudwatch.service");
const { getS3Pricing } = require("../aws/pricing.service");

const { saveResources } = require("../database/resource.repository");
const { saveRecommendation } = require("../database/recommendation.repository");
const { saveInsights } = require("../database/insight.repository");

const {
  analyzeBucketConfiguration,
  analyzeBucketPolicy,
  analyzeLifecycleRules,
  analyzeStorageClassDistribution,
} = require("../analyzer/s3.analyzer");
const {
  getS3Recommendation,
  getS3EncryptionRecommendation,
  getS3StorageRecommendation,
  getS3PolicyRecommendation,
  getS3LifecycleRecommendation,
  getS3StorageClassRecommendation,
  mergeS3Recommendations,
} = require("../recommender/s3.recommender");

const { buildS3PricingFilters } = require("../../builders/pricing.filter.builder");
const { extractStoragePricePerGB } = require("../../parser/pricing.parser");

const {
  calculateBucketSizeGB,
  calculateS3MonthlyCost,
  calculateS3EstimatedSavings,
} = require("../../calculator/storage.calculator");

const { generateS3Insights } = require("../insight/s3.insight");

const logBucketScanResult = (
  bucket,
  {
    analysis,
    recommendation,
    encryption,
    encryptionRecommendation,
    storage,
    storageRecommendation,
    lifecycleAnalysis,
    lifecycleRecommendation,
    distribution,
    storageClassRecommendation,
    policyAnalysis,
    policyRecommendation,
    mergedRecommendation,
  }
) => {
  console.log("=================================");
  console.log("Bucket:", bucket.bucketName);
  console.log("Issues:", analysis.issues);
  console.log("Recommendation:", recommendation);
  console.log("Encryption:", encryption);
  console.log("Encryption Recommendation:", encryptionRecommendation);
  console.log("Storage:", storage);
  console.log("Storage Recommendation:", storageRecommendation);
  console.log("Lifecycle:", lifecycleAnalysis);
  console.log("Lifecycle Recommendation:", lifecycleRecommendation);
  console.log("Storage Class Distribution:", distribution.percentages);
  console.log("Storage Class Recommendation:", storageClassRecommendation);
  console.log("Policy Findings:", policyAnalysis);
  console.log("Policy Recommendation:", policyRecommendation);
  console.log("Saved (merged) Recommendation:", mergedRecommendation);
};

// A bucket's price-per-GB lookup is allowed to fail independently of every
// other signal (missing pricing:GetProducts permission, an unmapped region,
// throttling, etc.) — calculateS3MonthlyCost already falls back to a
// standard S3 rate whenever pricePerGB is 0, so on failure we just log and
// let that fallback take over instead of failing the whole bucket/scan.
const getS3PricePerGB = async (pricingClient, region) => {
  try {
    const pricingFilters = buildS3PricingFilters(region);
    const pricingResponse = await getS3Pricing(pricingClient, pricingFilters);

    return extractStoragePricePerGB(pricingResponse);
  } catch (error) {
    console.warn(`Could not fetch S3 pricing for region ${region}:`, error.message);
    return 0;
  }
};

// Fetches a single bucket's configuration, storage, and pricing signals,
// saves ONE merged recommendation for it (config + encryption + storage +
// lifecycle + storage-class distribution + policy combined — see
// mergeS3Recommendations for why this is a single save rather than
// several), and returns the Resource record (metadata) to be persisted for
// it, along with the savings it contributes.
const processBucket = async (scanId, userId, clients, bucket) => {
  const { s3Client, cloudWatchClient, pricingClient } = clients;

  const [
    region,
    isPublic,
    versioningEnabled,
    lifecycleRules,
    encryption,
    hasReplication,
    storage,
    policy,
  ] = await Promise.all([
    getBucketRegion(s3Client, bucket.bucketName),
    isBucketPublic(s3Client, bucket.bucketName),
    isVersioningEnabled(s3Client, bucket.bucketName),
    getLifecycleRules(s3Client, bucket.bucketName),
    getBucketEncryption(s3Client, bucket.bucketName),
    hasReplicationConfigured(s3Client, bucket.bucketName),
    getS3StorageMetrics(cloudWatchClient, bucket.bucketName),
    getBucketPolicy(s3Client, bucket.bucketName),
  ]);

  const { encryptionEnabled, encryptionType } = encryption;
  const { bucketSizeBytes, objectCount, storageClassBytes } = storage;
  const bucketSizeGB = calculateBucketSizeGB(bucketSizeBytes);

  // Inspects every rule's content (transitions/expiration/multipart
  // cleanup) once; the booleans below feed the existing config/storage
  // checks exactly as the old hasLifecycleRules()/
  // hasIntelligentTieringTransition() service calls used to, just derived
  // from a single fetch instead of two redundant ones.
  const lifecycleAnalysis = analyzeLifecycleRules(lifecycleRules);
  const lifecycleConfigured = lifecycleAnalysis.configured;
  const hasIntelligentTiering = lifecycleAnalysis.hasIntelligentTiering;

  const distribution = analyzeStorageClassDistribution(storageClassBytes);

  const pricePerGB = await getS3PricePerGB(pricingClient, region);
  const monthlyCost = calculateS3MonthlyCost(bucketSizeGB, pricePerGB);

  const analysis = analyzeBucketConfiguration({
    isPublic,
    versioningEnabled,
    hasLifecycleRules: lifecycleConfigured,
  });

  const recommendation = getS3Recommendation(analysis);

  const encryptionRecommendation = getS3EncryptionRecommendation({
    encryptionEnabled,
    encryptionType,
  });

  const storageRecommendation = getS3StorageRecommendation({
    bucketSizeGB,
    objectCount,
    hasLifecycleRules: lifecycleConfigured,
    hasIntelligentTiering,
    hasReplication,
  });

  const estimatedSavings = calculateS3EstimatedSavings(monthlyCost, storageRecommendation.savingsRate);

  const lifecycleRecommendation = getS3LifecycleRecommendation({
    bucketSizeGB,
    lifecycleAnalysis,
  });

  const storageClassRecommendation = getS3StorageClassRecommendation({
    percentages: distribution.percentages,
    totalBytes: distribution.totalBytes,
  });

  const policyAnalysis = analyzeBucketPolicy(policy);
  const policyRecommendation = getS3PolicyRecommendation(policyAnalysis);

  const mergedRecommendation = mergeS3Recommendations({
    configRecommendation: recommendation,
    encryptionRecommendation,
    storageRecommendation,
    policyRecommendation,
    lifecycleRecommendation,
    storageClassRecommendation,
    monthlyCost,
    estimatedSavings,
  });

  await saveRecommendation({
    scanId,
    userId,
    resourceId: bucket.bucketName,
    severity: mergedRecommendation.severity,
    action: mergedRecommendation.action,
    confidence: mergedRecommendation.confidence,
    recommendation: mergedRecommendation.recommendation,
    reason: mergedRecommendation.reason,
    monthlyCost: mergedRecommendation.monthlyCost,
    estimatedSavings: mergedRecommendation.estimatedSavings,
  });

  logBucketScanResult(bucket, {
    analysis,
    recommendation,
    encryption,
    encryptionRecommendation,
    storage: { bucketSizeBytes, bucketSizeGB, objectCount, monthlyCost },
    storageRecommendation,
    lifecycleAnalysis,
    lifecycleRecommendation,
    distribution,
    storageClassRecommendation,
    policyAnalysis,
    policyRecommendation,
    mergedRecommendation,
  });

  return {
    estimatedSavings,
    // Compact per-bucket signals for generateS3Insights — deliberately just
    // the handful of primitives its rules actually check, rather than the
    // full metadata/analysis objects above.
    insightInput: {
      bucketName: bucket.bucketName,
      isPublic,
      publicPolicyGrant: policyAnalysis.publicRead || policyAnalysis.publicWrite || policyAnalysis.fullAccess,
      encryptionEnabled,
      versioningEnabled,
      hasLifecycleRules: lifecycleConfigured,
      bucketSizeGB,
      standardPercent: distribution.percentages.STANDARD,
      monthlyCost,
      estimatedSavings,
    },
    resource: {
      resourceId: bucket.bucketName,
      name: bucket.bucketName,
      metadata: {
        region,
        creationDate: bucket.creationDate,
        isPublic,
        versioningEnabled,
        hasLifecycleRules: lifecycleConfigured,
        encryptionEnabled,
        encryptionType,
        bucketSizeBytes,
        bucketSizeGB,
        objectCount,
        lifecycleDetails: {
          configured: lifecycleAnalysis.configured,
          ruleCount: lifecycleAnalysis.ruleCount,
          hasTransitionToIA: lifecycleAnalysis.hasTransitionToIA,
          hasTransitionToGlacier: lifecycleAnalysis.hasTransitionToGlacier,
          hasIntelligentTiering: lifecycleAnalysis.hasIntelligentTiering,
          hasExpirationRule: lifecycleAnalysis.hasExpirationRule,
          hasAbortIncompleteMultipartUpload: lifecycleAnalysis.hasAbortIncompleteMultipartUpload,
          onlyExpirationConfigured: lifecycleAnalysis.onlyExpirationConfigured,
        },
        storageClassDistribution: {
          bytes: distribution.bytes,
          percentages: distribution.percentages,
        },
        policyFindings: {
          exists: policyAnalysis.policyExists,
          wildcardPrincipal: policyAnalysis.hasWildcardPrincipal,
          publicRead: policyAnalysis.publicRead,
          publicWrite: policyAnalysis.publicWrite,
          fullAccess: policyAnalysis.fullAccess,
          wildcardPermissions: policyAnalysis.wildcardPermissions,
        },
      },
    },
  };
};

const scanS3 = async (scanId, userId, clients) => {
  const { s3Client } = clients;

  const buckets = await getBuckets(s3Client);

  const bucketResources = [];
  const insightInputs = [];
  let totalSavings = 0;

  for (const bucket of buckets) {
    const { resource, estimatedSavings, insightInput } = await processBucket(scanId, userId, clients, bucket);

    bucketResources.push(resource);
    insightInputs.push(insightInput);
    totalSavings += estimatedSavings;
  }

  await saveResources(scanId, "S3", bucketResources, userId);

  // Fleet-wide, rule-based (no LLM) insights computed once all buckets are
  // in, then persisted so the dashboard can read them back without
  // recomputing anything.
  const insights = generateS3Insights(insightInputs);
  await saveInsights(scanId, insights, userId);

  return {
    totalResources: buckets.length,
    estimatedSavings: totalSavings,
    resources: buckets,
  };
};

module.exports = {
  scanS3,
};
