const { fetchAuditLogs } = require("../services/auditLog/auditLog.service");
const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/apiResponse");

const getAuditLogs = asyncHandler(async (req, res) => {
  const logs = await fetchAuditLogs(req.user.userId);

  sendSuccess(res, logs);
});

module.exports = {
  getAuditLogs,
};
