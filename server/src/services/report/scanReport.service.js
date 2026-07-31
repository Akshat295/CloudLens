const { fetchScanDetails } = require("../scan/scanHistory.service");

// Reuses the same scan/resource/recommendation lookups the Scan Detail page
// already calls (fetchScanDetails), then derives the extra rollups the PDF
// needs (monthly cost, severity counts, resource-type counts) in plain JS —
// no new Mongo queries and nothing under services/scanner/ is touched.
const getScanReportData = async (scanId, userId) => {
  const details = await fetchScanDetails(scanId, userId);

  if (!details) return null;

  const { scan, resources, recommendations } = details;

  const severityCounts = { HIGH: 0, MEDIUM: 0, LOW: 0 };
  let monthlyCost = 0;

  recommendations.forEach((rec) => {
    if (rec.severity in severityCounts) {
      severityCounts[rec.severity] += 1;
    }
    monthlyCost += rec.monthlyCost || 0;
  });

  const resourceTypeCounts = resources.reduce((acc, resource) => {
    const type = resource.resourceType || "UNKNOWN";
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});

  return {
    scan,
    resources,
    recommendations,
    monthlyCost,
    severityCounts,
    resourceTypeCounts,
  };
};

module.exports = {
  getScanReportData,
};
