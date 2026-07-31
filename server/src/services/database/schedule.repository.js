const Schedule = require("../../models/Schedule");

const createSchedule = async ({ userId, frequency, enabled, nextRun }) => {
  return await Schedule.create({ userId, frequency, enabled, nextRun });
};

const getScheduleByUserId = async (userId) => {
  return await Schedule.findOne({ userId });
};

const getScheduleById = async (id, userId) => {
  return await Schedule.findOne({ _id: id, userId });
};

const updateSchedule = async (id, userId, updates) => {
  return await Schedule.findOneAndUpdate({ _id: id, userId }, updates, { new: true });
};

const deleteSchedule = async (id, userId) => {
  return await Schedule.findOneAndDelete({ _id: id, userId });
};

// Used only by the cron tick — it needs every user's due schedules, not one
// user's, so it deliberately doesn't take a userId.
const getDueSchedules = async (now) => {
  return await Schedule.find({ enabled: true, nextRun: { $lte: now } });
};

module.exports = {
  createSchedule,
  getScheduleByUserId,
  getScheduleById,
  updateSchedule,
  deleteSchedule,
  getDueSchedules,
};
