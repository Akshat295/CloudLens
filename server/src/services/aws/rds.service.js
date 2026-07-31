const {
  DescribeDBInstancesCommand,
} = require("@aws-sdk/client-rds");

const { mapRDSInstances } = require("../../mappers/rds.mapper");

const getDBInstances = async (rdsClient) => {
  const command = new DescribeDBInstancesCommand({});

  const response = await rdsClient.send(command);

  return mapRDSInstances(response);
};

module.exports = {
  getDBInstances,
};
