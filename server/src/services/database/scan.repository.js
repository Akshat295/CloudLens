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
      new: true,
    }
  );

  return scan;
};

const getAllScans = async () => {
  return await Scan.find().sort({ createdAt: -1 });
};

const getScanById = async (id) => {
  return await Scan.findById(id);
};

module.exports = {
  createScan,
  completeScan,
  getAllScans,
  getScanById,
};
