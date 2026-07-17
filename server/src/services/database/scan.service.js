const Scan = require("../../models/Scan");

const createScan = async () => {
  const scan = await Scan.create({
    status: "RUNNING",
  });

  return scan;
};

const completeScan = async (
  scanId,
  totalResources,
  estimatedSavings = 0
) => {
  const scan = await Scan.findByIdAndUpdate(
  scanId,
  {
    status: "COMPLETED",
    completedAt: new Date(),
    totalResources,
    estimatedSavings,
  },
  {
    returnDocument: "after",
  }
);

  return scan;
};

module.exports = {
  createScan,
  completeScan,
};