const {
  DescribeInstancesCommand,
} = require("@aws-sdk/client-ec2");

const { ec2Client } = require("../../config/aws");
const getEC2Instances = async () => {
  const command = new DescribeInstancesCommand({});

  const response = await ec2Client.send(command);

  const instances = [];

  for (const reservation of response.Reservations) {
    for (const instance of reservation.Instances) {

      instances.push({
        instanceId: instance.InstanceId,

        name:
          instance.Tags?.find(tag => tag.Key === "Name")?.Value || "N/A",

        state: instance.State.Name,

        instanceType: instance.InstanceType,

        availabilityZone: instance.Placement.AvailabilityZone,

        publicIp: instance.PublicIpAddress || null,

        privateIp: instance.PrivateIpAddress,

        launchTime: instance.LaunchTime
      });

    }
  }

  return instances;
};

module.exports = {
  getEC2Instances,
};