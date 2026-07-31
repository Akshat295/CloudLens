const {
  getCostTrend,
  getSavingsTrend,
  getResourceGrowth,
  getHighAlertsTrend,
} = require("../services/analytics/analytics.service");
const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/apiResponse");

const costTrend = asyncHandler(async (req, res) => {
  const data = await getCostTrend(req.user.userId);

  sendSuccess(res, data);
});

const savingsTrend = asyncHandler(async (req, res) => {
  const data = await getSavingsTrend(req.user.userId);

  sendSuccess(res, data);
});

const resourceGrowth = asyncHandler(async (req, res) => {
  const data = await getResourceGrowth(req.user.userId);

  sendSuccess(res, data);
});

const highAlertsTrend = asyncHandler(async (req, res) => {
  const data = await getHighAlertsTrend(req.user.userId);

  sendSuccess(res, data);
});

module.exports = {
  costTrend,
  savingsTrend,
  resourceGrowth,
  highAlertsTrend,
};
