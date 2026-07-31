const Notification = require("../../models/Notification");

const getNotificationSettingsByUserId = async (userId) => {
  return await Notification.findOne({ userId });
};

const createNotificationSettings = async ({ userId, email, scanCompleted, highSeverity, weeklyReport }) => {
  return await Notification.create({ userId, email, scanCompleted, highSeverity, weeklyReport });
};

const updateNotificationSettings = async (userId, updates) => {
  return await Notification.findOneAndUpdate({ userId }, updates, { new: true });
};

// Used by the weekly report cron — it needs every opted-in user, not one.
const getUsersWithWeeklyReportEnabled = async () => {
  return await Notification.find({ weeklyReport: true });
};

module.exports = {
  getNotificationSettingsByUserId,
  createNotificationSettings,
  updateNotificationSettings,
  getUsersWithWeeklyReportEnabled,
};
