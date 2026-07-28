const {
  DescribeInstancesCommand,
  StopInstancesCommand,
} = require("@aws-sdk/client-ec2");

const { ec2Client } = require("../../config/aws");

const { mapEC2Instances } = require("../../mappers/ec2.mapper");
const getEC2Instances = async () => {
  const command = new DescribeInstancesCommand({});

  const response = await ec2Client.send(command);

  return mapEC2Instances(response);
};

const stopEC2Instance = async (instanceId) => {
  const command = new StopInstancesCommand({
    InstanceIds: [instanceId],
  });

  return await ec2Client.send(command);
};

module.exports = {
  getEC2Instances,
  stopEC2Instance,
};