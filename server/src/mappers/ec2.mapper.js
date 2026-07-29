const mapEC2Instances = (response) => {
  const instances = [];

  for (const reservation of response.Reservations || []) {
    for (const instance of reservation.Instances || []) {
      instances.push({
        instanceId: instance.InstanceId,

        name:
          instance.Tags?.find((tag) => tag.Key === "Name")?.Value || "N/A",

        state: instance.State.Name,

        instanceType: instance.InstanceType,

        availabilityZone: instance.Placement.AvailabilityZone,

        publicIp: instance.PublicIpAddress || null,

        privateIp: instance.PrivateIpAddress,

        launchTime: instance.LaunchTime,

        securityGroups: (instance.SecurityGroups || []).map((group) => ({
          groupId: group.GroupId,
          groupName: group.GroupName,
        })),
      });
    }
  }

  return instances;
};

module.exports = {
  mapEC2Instances,
};