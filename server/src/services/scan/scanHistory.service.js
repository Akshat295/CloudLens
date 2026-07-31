const {
  getAllScans,
  getScanById,
} = require("../database/scan.repository");
const { getResourcesByScanId } = require("../database/resource.repository");
const {
  getRecommendationsByScanId,
} = require("../database/recommendation.repository");

const fetchAllScans = async (userId) => {
  return await getAllScans(userId);
};

const fetchScanDetails = async (id, userId) => {
  const scan = await getScanById(id, userId);

  if (!scan) {
    return null;
  }

  const [resources, recommendations] = await Promise.all([
    getResourcesByScanId(id, userId),
    getRecommendationsByScanId(id, userId),
  ]);

  return {
    scan,
    resources,
    recommendations,
  };
};

module.exports = {
  fetchAllScans,
  fetchScanDetails,
};
