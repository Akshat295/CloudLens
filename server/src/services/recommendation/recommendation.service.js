const {
  getLatestRecommendations,
  getRecommendationById,
  ignoreRecommendation,
  resolveRecommendation,
  enrichRecommendationWithResource,
} = require("../database/recommendation.repository");
const { stopEC2Instance } = require("../aws/ec2.service");
const { updateResourceState } = require("../database/resource.repository");

const fetchRecommendations = async () => {
  return await getLatestRecommendations();
};

const ignoreRecommendationById = async (id) => {
  const updated = await ignoreRecommendation(id);
  return await enrichRecommendationWithResource(updated);
};

const resolveRecommendationById = async (id) => {
  const updated = await resolveRecommendation(id);
  return await enrichRecommendationWithResource(updated);
};

const stopRecommendationById = async (id) => {
  const recommendation = await getRecommendationById(id);

  if (!recommendation) {
    throw new Error("Recommendation not found");
  }

  await stopEC2Instance(recommendation.resourceId);

  await updateResourceState(
    recommendation.scanId,
    recommendation.resourceId,
    "stopped"
  );

  const updated = await resolveRecommendation(id);
  return await enrichRecommendationWithResource(updated);
};

module.exports = {
  fetchRecommendations,
  ignoreRecommendationById,
  resolveRecommendationById,
  stopRecommendationById,
};