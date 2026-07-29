const Insight = require("../../models/Insight");
const Scan = require("../../models/Scan");

const saveInsights = async (scanId, insights) => {
  if (!insights.length) return [];

  const docs = insights.map((insight) => ({ scanId, ...insight }));
  return await Insight.insertMany(docs);
};

const getInsightsByScanId = async (scanId) => {
  return await Insight.find({ scanId }).sort({ createdAt: 1 });
};

const getLatestInsights = async () => {
  const latestScan = await Scan.findOne().sort({ createdAt: -1 });

  if (!latestScan) return [];

  return await getInsightsByScanId(latestScan._id);
};

module.exports = {
  saveInsights,
  getInsightsByScanId,
  getLatestInsights,
};
