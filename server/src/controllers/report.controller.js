const { getScanReportData } = require("../services/report/scanReport.service");
const { buildScanReportPdf } = require("../services/report/scanReportPdf.service");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");

const exportScanReport = asyncHandler(async (req, res) => {
  const reportData = await getScanReportData(req.params.id, req.user.userId);

  if (!reportData) {
    throw new ApiError(404, "Scan not found");
  }

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="cloudlens-scan-report-${req.params.id}.pdf"`
  );

  const doc = buildScanReportPdf(reportData);
  doc.pipe(res);
  doc.end();
});

module.exports = {
  exportScanReport,
};
