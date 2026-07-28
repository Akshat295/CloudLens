const {
  getAllScans,
  getScanById,
} = require("../database/scan.repository");
const { getResourcesByScanId } = require("../database/resource.repository");
const {
  getRecommendationsByScanId,
} = require("../database/recommendation.repository");

const fetchAllScans = async () => {
  return await getAllScans();
};

const fetchScanDetails = async (id) => {
  const scan = await getScanById(id);

  if (!scan) {
    return null;
  }

  const [resources, recommendations] = await Promise.all([
    getResourcesByScanId(id),
    getRecommendationsByScanId(id),
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
