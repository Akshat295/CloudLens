const {
  DescribeInstancesCommand,
  StopInstancesCommand,
  DescribeVolumesCommand,
  DescribeAddressesCommand,
} = require("@aws-sdk/client-ec2");

const { mapEC2Instances } = require("../../mappers/ec2.mapper");

const getEC2Instances = async (ec2Client) => {
  const command = new DescribeInstancesCommand({});

  const response = await ec2Client.send(command);

  return mapEC2Instances(response);
};

const stopEC2Instance = async (ec2Client, instanceId) => {
  const command = new StopInstancesCommand({
    InstanceIds: [instanceId],
  });

  return await ec2Client.send(command);
};

// Fetched once per scan (not per instance) and grouped client-side in
// ec2.scanner.js — cheaper than one DescribeVolumes/DescribeAddresses call
// per instance and keeps this service's shape consistent with getEC2Instances.
const getEBSVolumes = async (ec2Client) => {
  const command = new DescribeVolumesCommand({});

  const response = await ec2Client.send(command);

  return response.Volumes || [];
};

const getElasticIPAddresses = async (ec2Client) => {
  const command = new DescribeAddressesCommand({});

  const response = await ec2Client.send(command);

  return response.Addresses || [];
};

module.exports = {
  getEC2Instances,
  stopEC2Instance,
  getEBSVolumes,
  getElasticIPAddresses,
};
