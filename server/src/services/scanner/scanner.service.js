const {
  createScan,
  completeScan,
} = require("../database/scan.repository");

const { scanEC2 } = require("./ec2.scanner");
const { scanS3 } = require("./s3.scanner");

// EBS/RDS scanners will be added here following the same
// scan(scanId) -> { totalResources, estimatedSavings } contract as scanEC2.
const scanInfrastructure = async () => {
  const scan = await createScan();

  const ec2Result = await scanEC2(scan._id);

  // S3 is scanned defensively: an account without S3 read permissions (a
  // likely gap for an existing EC2-only setup) should not turn a previously
  // working scan into a failed one.
  let s3Result = { totalResources: 0, estimatedSavings: 0 };
  try {
    s3Result = await scanS3(scan._id);
  } catch (error) {
    console.error("S3 scan failed:", error.message);
  }

  const totalResources = ec2Result.totalResources + s3Result.totalResources;
  const estimatedSavings = ec2Result.estimatedSavings + s3Result.estimatedSavings;

  await completeScan(scan._id, totalResources, estimatedSavings);

  return {
    scanId: scan._id,
    totalResources,
    estimatedSavings,
  };
};

module.exports = {
  scanInfrastructure,
};
