const {
  fetchRecommendations,
  ignoreRecommendationById,
  resolveRecommendationById,
  stopRecommendationById,
} = require("../services/recommendation/recommendation.service");
const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/apiResponse");

const getRecommendations = asyncHandler(async (req, res) => {
  const recommendations = await fetchRecommendations();

  sendSuccess(res, recommendations);
});

const ignoreRecommendation = asyncHandler(async (req, res) => {
  const recommendation = await ignoreRecommendationById(req.params.id);

  sendSuccess(res, recommendation);
});

const resolveRecommendation = asyncHandler(async (req, res) => {
  const recommendation = await resolveRecommendationById(req.params.id);

  sendSuccess(res, recommendation);
});

const stopRecommendation = asyncHandler(async (req, res) => {
  const recommendation = await stopRecommendationById(req.params.id);

  sendSuccess(res, recommendation);
});

module.exports = {
  getRecommendations,
  ignoreRecommendation,
  resolveRecommendation,
  stopRecommendation,
};
