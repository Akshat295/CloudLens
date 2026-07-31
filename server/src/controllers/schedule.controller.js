const {
  addSchedule,
  fetchSchedules,
  editSchedule,
  removeSchedule,
} = require("../services/schedule/schedule.service");
const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/apiResponse");
const ApiError = require("../utils/ApiError");

const createSchedule = asyncHandler(async (req, res) => {
  const { frequency, enabled } = req.body;

  if (!frequency) {
    throw new ApiError(400, "Frequency is required");
  }

  const schedule = await addSchedule({ userId: req.user.userId, frequency, enabled });

  sendSuccess(res, schedule, 201);
});

const getSchedules = asyncHandler(async (req, res) => {
  const schedules = await fetchSchedules(req.user.userId);

  sendSuccess(res, schedules);
});

const updateSchedule = asyncHandler(async (req, res) => {
  const { frequency, enabled } = req.body;

  const schedule = await editSchedule(req.params.id, req.user.userId, { frequency, enabled });

  sendSuccess(res, schedule);
});

const deleteSchedule = asyncHandler(async (req, res) => {
  await removeSchedule(req.params.id, req.user.userId);

  sendSuccess(res, { deleted: true });
});

module.exports = {
  createSchedule,
  getSchedules,
  updateSchedule,
  deleteSchedule,
};
