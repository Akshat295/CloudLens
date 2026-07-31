const {
  getLatestRecommendations,
  getRecommendationById,
  ignoreRecommendation,
  resolveRecommendation,
  enrichRecommendationWithResource,
} = require("../database/recommendation.repository");
const { stopEC2Instance } = require("../aws/ec2.service");
const { createEC2Client } = require("../../config/aws");
const { updateResourceState } = require("../database/resource.repository");
const ApiError = require("../../utils/ApiError");

const fetchRecommendations = async (userId) => {
  return await getLatestRecommendations(userId);
};

const ignoreRecommendationById = async (id, userId) => {
  const updated = await ignoreRecommendation(id, userId);

  if (!updated) {
    throw new ApiError(404, "Recommendation not found");
  }

  return await enrichRecommendationWithResource(updated);
};

const resolveRecommendationById = async (id, userId) => {
  const updated = await resolveRecommendation(id, userId);

  if (!updated) {
    throw new ApiError(404, "Recommendation not found");
  }

  return await enrichRecommendationWithResource(updated);
};

const stopRecommendationById = async (id, userId) => {
  const recommendation = await getRecommendationById(id, userId);

  if (!recommendation) {
    throw new ApiError(404, "Recommendation not found");
  }

  // The frontend already hides "Stop Instance" once the resource shows as
  // stopped, but that snapshot can go stale (another scan, another tab, a
  // direct API call) — checking again here is what turns "AWS rejects an
  // already-stopped instance" into a clean 400 instead of a raw SDK error.
  const enriched = await enrichRecommendationWithResource(recommendation);
  if (enriched?.state?.toLowerCase() === "stopped") {
    throw new ApiError(400, "This instance is already stopped.");
  }

  const ec2Client = createEC2Client();
  await stopEC2Instance(ec2Client, recommendation.resourceId);

  await updateResourceState(
    recommendation.scanId,
    recommendation.resourceId,
    "stopped",
    userId
  );

  const updated = await resolveRecommendation(id, userId);
  return await enrichRecommendationWithResource(updated);
};

module.exports = {
  fetchRecommendations,
  ignoreRecommendationById,
  resolveRecommendationById,
  stopRecommendationById,
};
