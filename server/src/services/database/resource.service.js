const Resource = require("../../models/Resource");

const saveResources = async (scanId, resources) => {
  const formattedResources = resources.map((resource) => ({
    scanId,
    resourceType: "EC2",
    resourceId: resource.instanceId,
    name: resource.name,
    state: resource.state,

    metadata: {
      instanceType: resource.instanceType,
      availabilityZone: resource.availabilityZone,
      publicIp: resource.publicIp,
      privateIp: resource.privateIp,
      launchTime: resource.launchTime,
    },
  }));

  await Resource.insertMany(formattedResources);

  return formattedResources;
};

module.exports = {
  saveResources,
};