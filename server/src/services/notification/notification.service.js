const {
  getNotificationSettingsByUserId,
  createNotificationSettings,
  updateNotificationSettings,
} = require("../database/notification.repository");
const { findUserById } = require("../database/user.repository");
const ApiError = require("../../utils/ApiError");

// Every user implicitly has notification settings, they just haven't
// customized them yet — so unlike AWS connections or scan schedules (which
// are genuinely optional), a GET here auto-creates a default row instead of
// returning null, matching how a typical "Settings" page always has
// something to show.
const getOrCreateSettings = async (userId) => {
  const existing = await getNotificationSettingsByUserId(userId);
  if (existing) return existing;

  const user = await findUserById(userId);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return await createNotificationSettings({
    userId,
    email: user.email,
    scanCompleted: true,
    highSeverity: true,
    weeklyReport: true,
  });
};

const editSettings = async (userId, { email, scanCompleted, highSeverity, weeklyReport }) => {
  await getOrCreateSettings(userId);

  const updates = {};
  if (email !== undefined) updates.email = email;
  if (scanCompleted !== undefined) updates.scanCompleted = scanCompleted;
  if (highSeverity !== undefined) updates.highSeverity = highSeverity;
  if (weeklyReport !== undefined) updates.weeklyReport = weeklyReport;

  return await updateNotificationSettings(userId, updates);
};

module.exports = {
  getOrCreateSettings,
  editSettings,
};
