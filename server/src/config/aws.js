const { EC2Client } = require("@aws-sdk/client-ec2");
const {
  CloudWatchClient,
} = require("@aws-sdk/client-cloudwatch");
const {
  PricingClient,
} = require("@aws-sdk/client-pricing");

const config = {
  region: process.env.AWS_REGION,
};

const ec2Client = new EC2Client(config);

const cloudWatchClient =
  new CloudWatchClient(config);

// Pricing API sirf us-east-1 endpoint se serve hoti hai.
const pricingClient =
  new PricingClient({
    region: "us-east-1",
  });

module.exports = {
  ec2Client,
  cloudWatchClient,
  pricingClient,
};