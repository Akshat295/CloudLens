const { EC2Client } = require("@aws-sdk/client-ec2");
const { CloudWatchClient } = require("@aws-sdk/client-cloudwatch");

const config = {
    region: process.env.AWS_REGION,
};

const ec2Client = new EC2Client(config);

const cloudWatchClient = new CloudWatchClient(config);

module.exports = {
    ec2Client,
    cloudWatchClient,
};