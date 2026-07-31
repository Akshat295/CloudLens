const cron = require("node-cron");

const { getUsersWithWeeklyReportEnabled } = require("../database/notification.repository");
const { getDashboardSummary } = require("../database/dashboard.repository");
const { sendWeeklyReportEmail } = require("../email/email.service");

// Reuses the same latest-scan summary the dashboard itself shows (already
// scoped per user) rather than adding new aggregation logic — nothing under
// services/scanner/ is touched.
const sendWeeklyReports = async () => {
  const subscribers = await getUsersWithWeeklyReportEnabled();

  for (const settings of subscribers) {
    try {
      const summary = await getDashboardSummary(settings.userId);
      await sendWeeklyReportEmail(settings.email, summary);
    } catch (error) {
      console.error(`Weekly report failed for user ${settings.userId}:`, error.message);
    }
  }
};

const startWeeklyReportScheduler = () => {
  // Every Monday at 08:00.
  cron.schedule("0 8 * * 1", sendWeeklyReports);
  console.log("Weekly cost report cron started (Mondays at 08:00)");
};

module.exports = {
  startWeeklyReportScheduler,
  sendWeeklyReports,
};
