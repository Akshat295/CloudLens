export const formatCurrency = (value) => `$${Number(value || 0).toFixed(2)}`;

// Human-readable labels for Recommendation.action — covers both the
// original EC2/S3/RDS action set and the newer IAM-specific ones. Falls
// back to a generic snake_case -> Title Case conversion for anything not
// explicitly listed, so a future action value still renders reasonably.
const ACTION_LABELS = {
  NONE: "No Action Needed",
  STOP: "Stop Instance",
  DOWNSIZE: "Downsize",
  UPSIZE: "Upsize",
  REVIEW: "Review",
  ENABLE_MFA: "Enable MFA",
  DELETE_UNUSED_KEY: "Delete Unused Key",
  REVIEW_PERMISSIONS: "Review Permissions",
  ROTATE_ACCESS_KEY: "Rotate Access Key",
  REMOVE_ADMIN_ACCESS: "Remove Admin Access",
  DELETE_UNUSED_ROLE: "Delete Unused Resource",
  TAG_RESOURCE: "Add Tags",
};

export const formatActionLabel = (action) =>
  ACTION_LABELS[action] ||
  (action || "")
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

// Human-readable labels for AuditLog.action. Same fallback strategy as
// formatActionLabel above, plus explicit entries for the few values whose
// title-cased form would read oddly ("Aws"/"Ec2" instead of "AWS"/"EC2").
const AUDIT_ACTION_LABELS = {
  USER_LOGIN: "User Login",
  AWS_CONNECTED: "AWS Connected",
  AWS_DISCONNECTED: "AWS Disconnected",
  SCAN_STARTED: "Scan Started",
  SCAN_COMPLETED: "Scan Completed",
  RECOMMENDATION_IGNORED: "Recommendation Ignored",
  RECOMMENDATION_RESOLVED: "Recommendation Resolved",
  EC2_STOPPED: "EC2 Stopped",
};

export const formatAuditActionLabel = (action) =>
  AUDIT_ACTION_LABELS[action] ||
  (action || "")
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

export const formatPercent = (value) => `${Number(value || 0).toFixed(1)}%`;

const BYTE_UNITS = ["B", "KB", "MB", "GB", "TB"];

export const formatBytes = (value) => {
  const bytes = Number(value || 0);
  if (bytes <= 0) return "0 B";

  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), BYTE_UNITS.length - 1);
  const scaled = bytes / 1024 ** exponent;
  return `${scaled.toFixed(scaled >= 10 || exponent === 0 ? 0 : 1)} ${BYTE_UNITS[exponent]}`;
};

export const formatDateTime = (value) => {
  if (!value) return "N/A";

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "N/A" : date.toLocaleString();
};

export const formatScanTime = (scan) =>
  formatDateTime(scan.completedAt || scan.startedAt || scan.createdAt);

// Scans don't store a duration field — it's derived from the two timestamps
// the backend already returns, so no API change is needed to surface it.
export const getScanDurationMs = (scan) => {
  if (!scan?.startedAt || !scan?.completedAt) return null;

  const ms = new Date(scan.completedAt).getTime() - new Date(scan.startedAt).getTime();
  return Number.isNaN(ms) || ms < 0 ? null : ms;
};

export const formatDuration = (ms) => {
  if (ms == null) return null;

  const totalSeconds = Math.round(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
};

export const formatScanDuration = (scan) =>
  formatDuration(getScanDurationMs(scan)) || (scan?.status === "RUNNING" ? "In progress" : "—");
