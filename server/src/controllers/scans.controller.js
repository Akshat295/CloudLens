const {
  fetchAllScans,
  fetchScanDetails,
} = require("../services/scan/scanHistory.service");
const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/apiResponse");
const ApiError = require("../utils/ApiError");

const getScans = asyncHandler(async (req, res) => {
  const scans = await fetchAllScans(req.user.userId);

  sendSuccess(res, scans);
});

const getScanById = asyncHandler(async (req, res) => {
  const details = await fetchScanDetails(req.params.id, req.user.userId);

  if (!details) {
    throw new ApiError(404, "Scan not found");
  }

  sendSuccess(res, details);
});

module.exports = {
  getScans,
  getScanById,
};
