const Resource = require("../../models/Resource");

// `resources` must already be in the generic Resource shape
// ({ resourceId, name, state, metadata }) — each scanner is responsible for
// mapping its own AWS data into that shape before calling this.
const saveResources = async (scanId, resourceType, resources, userId) => {
  const formattedResources = resources.map((resource) => ({
    userId,
    scanId,
    resourceType,
    resourceId: resource.resourceId,
    name: resource.name,
    state: resource.state,
    metadata: resource.metadata,
  }));

  await Resource.insertMany(formattedResources);

  return formattedResources;
};

const updateResourceState = async (scanId, resourceId, state, userId) => {
  return await Resource.findOneAndUpdate(
    { scanId, resourceId, userId },
    { state },
    { new: true }
  );
};

const getResourcesByScanId = async (scanId, userId) => {
  return await Resource.find({ scanId, userId }).sort({ createdAt: -1 });
};

module.exports = {
  saveResources,
  updateResourceState,
  getResourcesByScanId,
};
