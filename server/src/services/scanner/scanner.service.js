const { getEC2Instances } = require("../aws/ec2.service");

const scanInfrastructure = async () => {
  const ec2Data = await getEC2Instances();

  return {
    ec2: ec2Data,
  };
};

module.exports = {
  scanInfrastructure,
};