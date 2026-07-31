const { scanInfrastructure } = require("../services/scanner/scanner.service");
const { recordAuditLog } = require("../services/auditLog/auditLog.service");
const { AUDIT_ACTIONS } = require("../constants/auditActions");
const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/apiResponse");

const scan = asyncHandler(async (req, res) => {
  await recordAuditLog(req.user.userId, AUDIT_ACTIONS.SCAN_STARTED, "Infrastructure scan started");

  const result = await scanInfrastructure(req.user.userId);

  await recordAuditLog(
    req.user.userId,
    AUDIT_ACTIONS.SCAN_COMPLETED,
    `Scan completed — ${result.totalResources} resources scanned, $${result.estimatedSavings.toFixed(2)} potential savings identified`
  );

  sendSuccess(res, result);
});

module.exports = {
  scan,
};
