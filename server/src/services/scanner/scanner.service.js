const { getEC2Instances } = require("../aws/ec2.service");

const {
  createScan,
  completeScan,
} = require("../database/scan.service");

const {
  saveResources,
} = require("../database/resource.service");

const scanInfrastructure = async () => {
  const scan = await createScan();

  const ec2 = await getEC2Instances();

  await saveResources(scan._id, ec2);

  await completeScan(scan._id, ec2.length);

  return {
    scanId: scan._id,
    totalResources: ec2.length,
    ec2,
  };
};

module.exports = {
  scanInfrastructure,
};