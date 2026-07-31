const {
  getCompletedScansForUser,
  getMonthlyCostByScan,
  getHighAlertsByScan,
} = require("../database/analytics.repository");

const scanDate = (scan) => scan.completedAt || scan.startedAt || scan.createdAt;

const getCostTrend = async (userId) => {
  const scans = await getCompletedScansForUser(userId);
  if (!scans.length) return [];

  const scanIds = scans.map((scan) => scan._id);
  const costByScan = await getMonthlyCostByScan(scanIds);
  const costMap = new Map(costByScan.map((entry) => [entry._id.toString(), entry.monthlyCost]));

  return scans.map((scan) => ({
    date: scanDate(scan),
    monthlyCost: costMap.get(scan._id.toString()) || 0,
  }));
};

const getSavingsTrend = async (userId) => {
  const scans = await getCompletedScansForUser(userId);

  return scans.map((scan) => ({
    date: scanDate(scan),
    estimatedSavings: scan.estimatedSavings || 0,
  }));
};

const getResourceGrowth = async (userId) => {
  const scans = await getCompletedScansForUser(userId);

  return scans.map((scan) => ({
    date: scanDate(scan),
    totalResources: scan.totalResources || 0,
  }));
};

// Not one of the three explicitly-named APIs, but the frontend's 4th chart
// ("High Alerts Trend") needs a data source — added to match that pattern
// rather than overloading one of the other three responses with unrelated
// fields.
const getHighAlertsTrend = async (userId) => {
  const scans = await getCompletedScansForUser(userId);
  if (!scans.length) return [];

  const scanIds = scans.map((scan) => scan._id);
  const alertsByScan = await getHighAlertsByScan(scanIds);
  const alertsMap = new Map(alertsByScan.map((entry) => [entry._id.toString(), entry.highAlerts]));

  return scans.map((scan) => ({
    date: scanDate(scan),
    highAlerts: alertsMap.get(scan._id.toString()) || 0,
  }));
};

module.exports = {
  getCostTrend,
  getSavingsTrend,
  getResourceGrowth,
  getHighAlertsTrend,
};
