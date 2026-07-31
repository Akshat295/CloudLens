const Scan = require("../../models/Scan");
const Recommendation = require("../../models/Recommendation");

// Every completed Scan document is already a historical summary snapshot
// (totalResources, estimatedSavings, completedAt) — trend data is built
// directly from these rather than a separate "summary" collection that
// would just duplicate what's already stored per scan.
const getCompletedScansForUser = async (userId) => {
  return await Scan.find({ userId, status: "COMPLETED" }).sort({ completedAt: 1 });
};

// scanIds are already user-scoped (derived from getCompletedScansForUser),
// so these aggregations don't need to re-match on userId.
const getMonthlyCostByScan = async (scanIds) => {
  return await Recommendation.aggregate([
    { $match: { scanId: { $in: scanIds } } },
    { $group: { _id: "$scanId", monthlyCost: { $sum: "$monthlyCost" } } },
  ]);
};

const getHighAlertsByScan = async (scanIds) => {
  return await Recommendation.aggregate([
    { $match: { scanId: { $in: scanIds }, severity: "HIGH" } },
    { $group: { _id: "$scanId", highAlerts: { $sum: 1 } } },
  ]);
};

module.exports = {
  getCompletedScansForUser,
  getMonthlyCostByScan,
  getHighAlertsByScan,
};
