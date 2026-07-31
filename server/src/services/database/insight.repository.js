const Insight = require("../../models/Insight");
const Scan = require("../../models/Scan");

const saveInsights = async (scanId, insights, userId) => {
  if (!insights.length) return [];

  const docs = insights.map((insight) => ({ scanId, userId, ...insight }));
  return await Insight.insertMany(docs);
};

const getInsightsByScanId = async (scanId, userId) => {
  return await Insight.find({ scanId, userId }).sort({ createdAt: 1 });
};

const getLatestInsights = async (userId) => {
  const latestScan = await Scan.findOne({ userId }).sort({ createdAt: -1 });

  if (!latestScan) return [];

  return await getInsightsByScanId(latestScan._id, userId);
};

module.exports = {
  saveInsights,
  getInsightsByScanId,
  getLatestInsights,
};
