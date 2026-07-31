const Recommendation = require("../../models/Recommendation");
const Scan = require("../../models/Scan");
const Resource = require("../../models/Resource");

const enrichRecommendationsWithResources = async (recommendations) => {
  if (!recommendations.length) return [];

  const scanId = recommendations[0].scanId;
  const userId = recommendations[0].userId;
  const resourceIds = recommendations.map((rec) => rec.resourceId);

  const resources = await Resource.find({
    scanId,
    userId,
    resourceId: { $in: resourceIds },
  });

  const resourceMap = new Map(
    resources.map((resource) => [resource.resourceId, resource])
  );

  return recommendations.map((rec) => {
    const doc = rec.toObject ? rec.toObject() : rec;
    const resource = resourceMap.get(doc.resourceId);

    if (!resource) return doc;

    return {
      ...doc,
      resourceName: resource.name,
      resourceType: resource.resourceType,
      instanceType: resource.metadata?.instanceType,
      state: resource.state,
      publicIp: resource.metadata?.publicIp,
      privateIp: resource.metadata?.privateIp,
      availabilityZone: resource.metadata?.availabilityZone,
      launchTime: resource.metadata?.launchTime,
      metadata: resource.metadata,
    };
  });
};

const enrichRecommendationWithResource = async (recommendation) => {
  if (!recommendation) return null;

  const [enriched] = await enrichRecommendationsWithResources([
    recommendation,
  ]);

  return enriched;
};

const saveRecommendation = async (recommendationData) => {
  return await Recommendation.create(recommendationData);
};

const getRecommendationsByScanId = async (scanId, userId) => {
  const recommendations = await Recommendation.find({ scanId, userId }).sort({
    createdAt: -1,
  });

  return await enrichRecommendationsWithResources(recommendations);
};

const getLatestRecommendations = async (userId) => {
  const latestScan = await Scan.findOne({ userId }).sort({
    createdAt: -1,
  });

  if (!latestScan) return [];

  const recommendations = await Recommendation.find({
    scanId: latestScan._id,
    userId,
  }).sort({
    createdAt: -1,
  });

  return await enrichRecommendationsWithResources(recommendations);
};

const getRecommendationById = async (id, userId) => {
  return await Recommendation.findOne({ _id: id, userId });
};

const ignoreRecommendation = async (id, userId) => {
  return await Recommendation.findOneAndUpdate(
    { _id: id, userId },
    {
      status: "IGNORED",
    },
    {
      new: true,
    }
  );
};

const resolveRecommendation = async (id, userId) => {
  return await Recommendation.findOneAndUpdate(
    { _id: id, userId },
    {
      status: "RESOLVED",
    },
    {
      new: true,
    }
  );
};

module.exports = {
  saveRecommendation,
  getLatestRecommendations,
  getRecommendationsByScanId,
  getRecommendationById,
  ignoreRecommendation,
  resolveRecommendation,
  enrichRecommendationWithResource,
};
