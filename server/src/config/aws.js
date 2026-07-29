const {
  EC2Client,
} = require("@aws-sdk/client-ec2");

const {
  S3Client,
} = require("@aws-sdk/client-s3");

const {
  CloudWatchClient,
} = require("@aws-sdk/client-cloudwatch");
const {
  PricingClient,
} = require("@aws-sdk/client-pricing");
const {
  RDSClient,
} = require("@aws-sdk/client-rds");
const {
  IAMClient,
} = require("@aws-sdk/client-iam");

const config = {
  region: process.env.AWS_REGION,
};

const ec2Client = new EC2Client(config);
const s3Client = new S3Client(config);
const cloudWatchClient = new CloudWatchClient(config);
const rdsClient = new RDSClient(config);

// IAM is a global service (no per-region endpoints) but the client still
// takes the same config shape as every other client here.
const iamClient = new IAMClient(config);

// The AWS Pricing API is only served from the us-east-1 endpoint,
// regardless of which region the scanned resources live in.
const pricingClient = new PricingClient({
  region: "us-east-1",
});

module.exports = {
  ec2Client,
  s3Client,
  cloudWatchClient,
  pricingClient,
  rdsClient,
  iamClient,
};