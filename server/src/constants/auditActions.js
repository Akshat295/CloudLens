// Single source of truth for audit action types — used by the AuditLog
// model (schema enum) and every controller that records an entry, so a new
// action type only needs to be added in one place.
const AUDIT_ACTIONS = {
  USER_LOGIN: "USER_LOGIN",
  AWS_CONNECTED: "AWS_CONNECTED",
  AWS_DISCONNECTED: "AWS_DISCONNECTED",
  SCAN_STARTED: "SCAN_STARTED",
  SCAN_COMPLETED: "SCAN_COMPLETED",
  RECOMMENDATION_IGNORED: "RECOMMENDATION_IGNORED",
  RECOMMENDATION_RESOLVED: "RECOMMENDATION_RESOLVED",
  EC2_STOPPED: "EC2_STOPPED",
};

module.exports = {
  AUDIT_ACTIONS,
  AUDIT_ACTION_VALUES: Object.values(AUDIT_ACTIONS),
};
