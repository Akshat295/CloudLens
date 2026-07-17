const Recommendation = require("../../models/Recommendation");

const saveRecommendation = async (
  recommendationData
) => {
  return await Recommendation.create(
    recommendationData
  );
};

module.exports = {
  saveRecommendation,
};