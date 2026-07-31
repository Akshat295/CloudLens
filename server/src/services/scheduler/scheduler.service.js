const cron = require("node-cron");

const { getDueSchedules, updateSchedule } = require("../database/schedule.repository");
const { scanInfrastructure } = require("../scanner/scanner.service");
const { computeNextRun } = require("../../utils/schedule.util");
const { notifyScanCompletion } = require("../notification/scanNotification.service");

// A schedule's nextRun only advances once its scan finishes, so if scanning
// every due account takes longer than the 60s tick interval, the next tick
// would otherwise see the same schedule as still "due" and start a second,
// concurrent scan for the same user. Tracking in-flight schedule IDs closes
// that window — a tick simply skips anything still running from a previous
// tick instead of double-processing it.
const inFlightScheduleIds = new Set();

// Rather than registering one cron job per user (which would need careful
// start/stop/restart bookkeeping on every create/update/delete, plus
// re-registering everything from the DB on server boot), a single job ticks
// every minute and asks the DB which schedules are actually due. This is
// simpler, survives restarts with no extra wiring, and naturally handles
// "update lastRun/nextRun after every run" as a per-schedule side effect of
// processing that schedule.
const runDueSchedules = async () => {
  const now = new Date();
  const dueSchedules = await getDueSchedules(now);

  for (const schedule of dueSchedules) {
    const scheduleId = schedule._id.toString();

    if (inFlightScheduleIds.has(scheduleId)) continue;
    inFlightScheduleIds.add(scheduleId);

    try {
      const result = await scanInfrastructure(schedule.userId);

      const lastRun = new Date();
      await updateSchedule(schedule._id, schedule.userId, {
        lastRun,
        nextRun: computeNextRun(schedule.frequency, lastRun),
      });

      // Notification failures must never affect scheduling state above —
      // the scan itself succeeded either way.
      try {
        await notifyScanCompletion(schedule.userId, result.scanId, result);
      } catch (notifyError) {
        console.error(`Post-scan notification failed for user ${schedule.userId}:`, notifyError.message);
      }
    } catch (error) {
      console.error(`Scheduled scan failed for user ${schedule.userId}:`, error.message);

      // lastRun is only updated on success, but nextRun still moves forward
      // so a persistently-failing account (e.g. AWS disconnected) is retried
      // on its normal interval instead of being hammered every minute.
      await updateSchedule(schedule._id, schedule.userId, {
        nextRun: computeNextRun(schedule.frequency, now),
      });
    } finally {
      inFlightScheduleIds.delete(scheduleId);
    }
  }
};

const startScheduler = () => {
  cron.schedule("* * * * *", runDueSchedules);
  console.log("Scheduled scan cron started (checking every minute)");
};

module.exports = {
  startScheduler,
  runDueSchedules,
};
