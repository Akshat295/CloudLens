const {
  createSchedule: createScheduleRecord,
  getScheduleByUserId,
  getScheduleById,
  updateSchedule: updateScheduleRecord,
  deleteSchedule: deleteScheduleRecord,
} = require("../database/schedule.repository");
const ApiError = require("../../utils/ApiError");
const { isValidFrequency, computeNextRun } = require("../../utils/schedule.util");

// One schedule per user, mirroring AwsConnection's one-connection-per-user
// design — the frontend only ever needs a single enabled/frequency/nextRun/
// lastRun set, not a list of independently-configured schedules.
const addSchedule = async ({ userId, frequency, enabled = true }) => {
  if (!isValidFrequency(frequency)) {
    throw new ApiError(400, "Frequency must be one of: hourly, daily, weekly");
  }

  const existing = await getScheduleByUserId(userId);

  if (existing) {
    throw new ApiError(409, "A scan schedule already exists. Update it instead of creating a new one.");
  }

  const nextRun = computeNextRun(frequency);

  return await createScheduleRecord({ userId, frequency, enabled, nextRun });
};

const fetchSchedules = async (userId) => {
  const schedule = await getScheduleByUserId(userId);
  return schedule ? [schedule] : [];
};

const editSchedule = async (id, userId, { frequency, enabled }) => {
  if (frequency !== undefined && !isValidFrequency(frequency)) {
    throw new ApiError(400, "Frequency must be one of: hourly, daily, weekly");
  }

  const current = await getScheduleById(id, userId);

  if (!current) {
    throw new ApiError(404, "Schedule not found");
  }

  const updates = {};
  if (frequency !== undefined) updates.frequency = frequency;
  if (enabled !== undefined) updates.enabled = enabled;

  // Recompute nextRun whenever the interval changes or the schedule is
  // (re)enabled, so it always counts forward from "now" instead of firing
  // immediately on a stale timestamp left over from before it was paused.
  const isBeingEnabled = enabled === true && !current.enabled;
  const isFrequencyChanging = frequency !== undefined && frequency !== current.frequency;

  if (isBeingEnabled || isFrequencyChanging) {
    updates.nextRun = computeNextRun(frequency !== undefined ? frequency : current.frequency);
  }

  return await updateScheduleRecord(id, userId, updates);
};

const removeSchedule = async (id, userId) => {
  const deleted = await deleteScheduleRecord(id, userId);

  if (!deleted) {
    throw new ApiError(404, "Schedule not found");
  }

  return deleted;
};

module.exports = {
  addSchedule,
  fetchSchedules,
  editSchedule,
  removeSchedule,
};
