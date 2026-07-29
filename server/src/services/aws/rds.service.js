const {
  DescribeDBInstancesCommand,
} = require("@aws-sdk/client-rds");

const { rdsClient } = require("../../config/aws");

const { mapRDSInstances } = require("../../mappers/rds.mapper");

const getDBInstances = async () => {
  const command = new DescribeDBInstancesCommand({});

  const response = await rdsClient.send(command);

  return mapRDSInstances(response);
};

module.exports = {
  getDBInstances,
};
