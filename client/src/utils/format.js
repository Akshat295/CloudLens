export const formatCurrency = (value) => `$${Number(value || 0).toFixed(2)}`;

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
