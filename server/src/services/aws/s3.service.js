const {
  ListBucketsCommand,
  GetBucketLocationCommand,
  GetPublicAccessBlockCommand,
  GetBucketVersioningCommand,
  GetBucketLifecycleConfigurationCommand,
  GetBucketEncryptionCommand,
  GetBucketReplicationCommand,
  GetBucketPolicyCommand,
} = require("@aws-sdk/client-s3");

const { mapS3Buckets } = require("../../mappers/s3.mapper");

const getBuckets = async (s3Client) => {
  const response = await s3Client.send(new ListBucketsCommand({}));

  return mapS3Buckets(response);
};

const getBucketRegion = async (s3Client, bucketName) => {
  try {
    const response = await s3Client.send(
      new GetBucketLocationCommand({ Bucket: bucketName })
    );

    // An empty LocationConstraint means the bucket lives in us-east-1.
    return response.LocationConstraint || "us-east-1";
  } catch (error) {
    console.warn(`Could not determine region for bucket ${bucketName}:`, error.message);
    return "unknown";
  }
};

// A bucket is treated as public unless all four Block Public Access
// settings are enabled. If no configuration exists at all, AWS throws
// NoSuchPublicAccessBlockConfiguration, which itself means nothing is
// blocking public access.
const isBucketPublic = async (s3Client, bucketName) => {
  try {
    const response = await s3Client.send(
      new GetPublicAccessBlockCommand({ Bucket: bucketName })
    );

    const config = response.PublicAccessBlockConfiguration || {};

    const fullyBlocked =
      config.BlockPublicAcls &&
      config.IgnorePublicAcls &&
      config.BlockPublicPolicy &&
      config.RestrictPublicBuckets;

    return !fullyBlocked;
  } catch (error) {
    if (error.name === "NoSuchPublicAccessBlockConfiguration") {
      return true;
    }

    console.warn(`Could not determine public access status for bucket ${bucketName}:`, error.message);
    return false;
  }
};

const isVersioningEnabled = async (s3Client, bucketName) => {
  try {
    const response = await s3Client.send(
      new GetBucketVersioningCommand({ Bucket: bucketName })
    );

    return response.Status === "Enabled";
  } catch (error) {
    console.warn(`Could not determine versioning status for bucket ${bucketName}:`, error.message);
    return true;
  }
};

// Fetches a bucket's lifecycle configuration once. Returns an array of
// rules (possibly empty) when a configuration exists, or `null` when we
// genuinely can't tell (a permission error, etc.) — a bucket with NO
// lifecycle configuration throws NoSuchLifecycleConfiguration, which is a
// definitive answer (resolved to `[]`), not an error condition.
//
// s3.analyzer.js's analyzeLifecycleRules() is what actually inspects the
// returned rules (transitions, expiration, multipart cleanup, etc.) — kept
// separate so this stays a plain fetch, mirroring getBucketPolicy above.
const getLifecycleRules = async (s3Client, bucketName) => {
  try {
    const response = await s3Client.send(
      new GetBucketLifecycleConfigurationCommand({ Bucket: bucketName })
    );

    return response.Rules || [];
  } catch (error) {
    if (error.name === "NoSuchLifecycleConfiguration") {
      return [];
    }

    console.warn(`Could not determine lifecycle configuration for bucket ${bucketName}:`, error.message);
    return null;
  }
};

// A bucket with no default encryption configuration throws
// ServerSideEncryptionConfigurationNotFoundError, which is itself a
// definitive answer (encryption is genuinely off) rather than an error
// condition. Any other failure (e.g. missing s3:GetEncryptionConfiguration)
// means we simply can't tell, so — mirroring isVersioningEnabled/
// hasLifecycleRules above — we fall back to AWS's account-wide default
// (SSE-S3/AES256 has been applied to every bucket automatically since
// January 2023) instead of raising a false "unencrypted" alarm.
const getBucketEncryption = async (s3Client, bucketName) => {
  try {
    const response = await s3Client.send(
      new GetBucketEncryptionCommand({ Bucket: bucketName })
    );

    const rule = response.ServerSideEncryptionConfiguration?.Rules?.[0];
    const algorithm = rule?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm;

    if (!algorithm) {
      return { encryptionEnabled: false, encryptionType: "None" };
    }

    return {
      encryptionEnabled: true,
      encryptionType: algorithm.startsWith("aws:kms") ? "aws:kms" : "AES256",
    };
  } catch (error) {
    if (error.name === "ServerSideEncryptionConfigurationNotFoundError") {
      return { encryptionEnabled: false, encryptionType: "None" };
    }

    console.warn(`Could not determine encryption status for bucket ${bucketName}:`, error.message);
    return { encryptionEnabled: true, encryptionType: "AES256" };
  }
};

// A bucket with no replication configuration throws
// ReplicationConfigurationNotFoundError, a definitive "not configured"
// answer. Any other failure means we can't tell, so we default to `false`
// rather than raise a false "unnecessary replication" flag.
const hasReplicationConfigured = async (s3Client, bucketName) => {
  try {
    const response = await s3Client.send(
      new GetBucketReplicationCommand({ Bucket: bucketName })
    );

    return Boolean(response.ReplicationConfiguration?.Rules?.length);
  } catch (error) {
    if (error.name === "ReplicationConfigurationNotFoundError") {
      return false;
    }

    console.warn(`Could not determine replication status for bucket ${bucketName}:`, error.message);
    return false;
  }
};

// A bucket with no policy throws NoSuchBucketPolicy — a definitive "no
// policy" answer (most buckets legitimately have none, so this isn't
// logged as a warning). Any other failure (missing s3:GetBucketPolicy
// permission, etc.) also resolves to `null`: a policy we can't read can't
// be safely evaluated for wildcard/public grants, so it's treated the same
// as "nothing to inspect" rather than guessed at.
const getBucketPolicy = async (s3Client, bucketName) => {
  try {
    const response = await s3Client.send(
      new GetBucketPolicyCommand({ Bucket: bucketName })
    );

    return JSON.parse(response.Policy);
  } catch (error) {
    if (error.name !== "NoSuchBucketPolicy") {
      console.warn(`Could not determine bucket policy for bucket ${bucketName}:`, error.message);
    }

    return null;
  }
};

module.exports = {
  getBuckets,
  getBucketRegion,
  isBucketPublic,
  isVersioningEnabled,
  getLifecycleRules,
  getBucketEncryption,
  hasReplicationConfigured,
  getBucketPolicy,
};
