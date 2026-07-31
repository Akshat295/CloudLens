const { EC2Client } = require("@aws-sdk/client-ec2");
const { S3Client } = require("@aws-sdk/client-s3");
const { CloudWatchClient } = require("@aws-sdk/client-cloudwatch");
const { PricingClient } = require("@aws-sdk/client-pricing");
const { RDSClient } = require("@aws-sdk/client-rds");
const { IAMClient } = require("@aws-sdk/client-iam");
const { STSClient } = require("@aws-sdk/client-sts");

// Builds the shared client config shape from optional decrypted credentials.
// With no credentials, the SDK falls back to its own default provider chain
// (env vars / shared config) — passing { accessKeyId, secretAccessKey } is
// what scopes a client to one specific connected AwsAccount instead.
const buildClientConfig = (credentials, region) => {
  const config = { region: region || process.env.AWS_REGION };

  if (credentials?.accessKeyId && credentials?.secretAccessKey) {
    config.credentials = {
      accessKeyId: credentials.accessKeyId,
      secretAccessKey: credentials.secretAccessKey,
    };
  }

  return config;
};

const createEC2Client = (credentials, region) => new EC2Client(buildClientConfig(credentials, region));
const createS3Client = (credentials, region) => new S3Client(buildClientConfig(credentials, region));
const createCloudWatchClient = (credentials, region) => new CloudWatchClient(buildClientConfig(credentials, region));
const createRDSClient = (credentials, region) => new RDSClient(buildClientConfig(credentials, region));

// IAM is a global service (no per-region endpoints) but the client still
// takes the same config shape as every other client here.
const createIAMClient = (credentials, region) => new IAMClient(buildClientConfig(credentials, region));

const createSTSClient = (credentials, region) => new STSClient(buildClientConfig(credentials, region));

// The AWS Pricing API is only served from the us-east-1 endpoint,
// regardless of which region the scanned resources live in.
const createPricingClient = (credentials) => new PricingClient(buildClientConfig(credentials, "us-east-1"));

module.exports = {
  createEC2Client,
  createS3Client,
  createCloudWatchClient,
  createRDSClient,
  createIAMClient,
  createSTSClient,
  createPricingClient,
};
