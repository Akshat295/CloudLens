const {
  DescribeInstancesCommand,
} = require("@aws-sdk/client-ec2");

const { ec2Client } = require("../../config/aws");

const { mapEC2Instances } = require("../../utils/mappers/ec2.mapper");

const getEC2Instances = async () => {
  const command = new DescribeInstancesCommand({});

  const response = await ec2Client.send(command);

  return mapEC2Instances(response);
};

module.exports = {
  getEC2Instances,
};