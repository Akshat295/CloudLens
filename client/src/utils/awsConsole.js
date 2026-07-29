// AWS Console URL builders. S3 bucket ARNs never include region/account
// (they're globally unique), so getS3BucketArn needs only the bucket name.
const DEFAULT_REGION = "us-east-1";

const buildS3ConsoleUrl = (bucketName, region, tab) => {
  const params = new URLSearchParams({ region: region || DEFAULT_REGION, tab });
  return `https://s3.console.aws.amazon.com/s3/buckets/${encodeURIComponent(bucketName)}?${params.toString()}`;
};

export const getS3ConsoleUrl = (bucketName, region) =>
  buildS3ConsoleUrl(bucketName, region, "objects");

export const getS3MetricsUrl = (bucketName, region) =>
  buildS3ConsoleUrl(bucketName, region, "metrics");

export const getS3PermissionsUrl = (bucketName, region) =>
  buildS3ConsoleUrl(bucketName, region, "permissions");

export const getS3BucketArn = (bucketName) => `arn:aws:s3:::${bucketName}`;
