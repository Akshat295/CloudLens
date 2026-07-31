const { getOrCreateSettings, editSettings } = require("../services/notification/notification.service");
const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/apiResponse");

const getSettings = asyncHandler(async (req, res) => {
  const settings = await getOrCreateSettings(req.user.userId);

  sendSuccess(res, settings);
});

const updateSettings = asyncHandler(async (req, res) => {
  const { email, scanCompleted, highSeverity, weeklyReport } = req.body;

  const settings = await editSettings(req.user.userId, { email, scanCompleted, highSeverity, weeklyReport });

  sendSuccess(res, settings);
});

module.exports = {
  getSettings,
  updateSettings,
};
