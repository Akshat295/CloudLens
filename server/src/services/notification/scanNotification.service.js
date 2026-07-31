const { getRecommendationsByScanId } = require("../database/recommendation.repository");
const { getNotificationSettingsByUserId } = require("../database/notification.repository");
const { sendScanCompletedEmail, sendHighSeverityEmail } = require("../email/email.service");

// Called after a scheduled scan finishes. Reads the just-completed scan's
// recommendations through the existing recommendation repository — nothing
// under services/scanner/ is touched, since deciding who gets emailed about
// a scan's results isn't the scanners' concern.
const notifyScanCompletion = async (userId, scanId, { totalResources, estimatedSavings }) => {
  const settings = await getNotificationSettingsByUserId(userId);
  if (!settings || (!settings.scanCompleted && !settings.highSeverity)) return;

  const recommendations = await getRecommendationsByScanId(scanId, userId);

  const bySeverity = { HIGH: [], MEDIUM: [], LOW: [] };
  for (const rec of recommendations) {
    if (bySeverity[rec.severity]) bySeverity[rec.severity].push(rec);
  }

  if (settings.scanCompleted) {
    try {
      await sendScanCompletedEmail(settings.email, {
        totalResources,
        highCount: bySeverity.HIGH.length,
        mediumCount: bySeverity.MEDIUM.length,
        lowCount: bySeverity.LOW.length,
        estimatedSavings,
      });
    } catch (error) {
      console.error(`Failed to send scan-completed email to ${settings.email}:`, error.message);
    }
  }

  if (settings.highSeverity && bySeverity.HIGH.length > 0) {
    try {
      await sendHighSeverityEmail(settings.email, {
        highCount: bySeverity.HIGH.length,
        recommendations: bySeverity.HIGH,
      });
    } catch (error) {
      console.error(`Failed to send high-severity email to ${settings.email}:`, error.message);
    }
  }
};

module.exports = { notifyScanCompletion };
