const {
  fetchRecommendations,
  ignoreRecommendationById,
  resolveRecommendationById,
  stopRecommendationById,
} = require("../services/recommendation/recommendation.service");
const { recordAuditLog } = require("../services/auditLog/auditLog.service");
const { AUDIT_ACTIONS } = require("../constants/auditActions");
const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/apiResponse");

const describeRecommendation = (recommendation) => recommendation.resourceName || recommendation.resourceId;

const getRecommendations = asyncHandler(async (req, res) => {
  const recommendations = await fetchRecommendations(req.user.userId);

  sendSuccess(res, recommendations);
});

const ignoreRecommendation = asyncHandler(async (req, res) => {
  const recommendation = await ignoreRecommendationById(req.params.id, req.user.userId);

  await recordAuditLog(
    req.user.userId,
    AUDIT_ACTIONS.RECOMMENDATION_IGNORED,
    `Recommendation ignored: ${describeRecommendation(recommendation)}`
  );

  sendSuccess(res, recommendation);
});

const resolveRecommendation = asyncHandler(async (req, res) => {
  const recommendation = await resolveRecommendationById(req.params.id, req.user.userId);

  await recordAuditLog(
    req.user.userId,
    AUDIT_ACTIONS.RECOMMENDATION_RESOLVED,
    `Recommendation resolved: ${describeRecommendation(recommendation)}`
  );

  sendSuccess(res, recommendation);
});

// stopRecommendationById already marks the recommendation resolved as part
// of stopping the instance — only EC2_STOPPED is logged here (not also
// RECOMMENDATION_RESOLVED) so one click doesn't produce two audit entries.
const stopRecommendation = asyncHandler(async (req, res) => {
  const recommendation = await stopRecommendationById(req.params.id, req.user.userId);

  await recordAuditLog(
    req.user.userId,
    AUDIT_ACTIONS.EC2_STOPPED,
    `EC2 instance stopped: ${describeRecommendation(recommendation)}`
  );

  sendSuccess(res, recommendation);
});

module.exports = {
  getRecommendations,
  ignoreRecommendation,
  resolveRecommendation,
  stopRecommendation,
};
