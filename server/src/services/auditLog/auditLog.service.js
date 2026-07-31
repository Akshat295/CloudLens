const { createAuditLog, getAuditLogsByUserId } = require("../database/auditLog.repository");

// Fire-and-forget: a failure to write an audit entry must never break the
// action being audited (login, scan, connecting AWS, ...), so every error is
// swallowed here rather than propagated to the caller. Mirrors how
// notifyScanCompletion is wrapped around scan completion elsewhere.
const recordAuditLog = async (userId, action, description) => {
  try {
    await createAuditLog({ userId, action, description });
  } catch (error) {
    console.error(`Failed to record audit log (${action}):`, error.message);
  }
};

const fetchAuditLogs = async (userId) => {
  return await getAuditLogsByUserId(userId);
};

module.exports = {
  recordAuditLog,
  fetchAuditLogs,
};
