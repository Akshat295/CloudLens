const {
  GetMetricDataCommand,
} = require("@aws-sdk/client-cloudwatch");

const { cloudWatchClient } = require("../../config/aws");

const getCPUUtilization = async (instanceId) => {
  const endTime = new Date();

  const startTime = new Date();
  startTime.setDate(startTime.getDate() - 7);

  const command = new GetMetricDataCommand({
    StartTime: startTime,
    EndTime: endTime,

    MetricDataQueries: [
      {
        Id: "cpu",

        MetricStat: {
          Metric: {
            Namespace: "AWS/EC2",

            MetricName: "CPUUtilization",

            Dimensions: [
              {
                Name: "InstanceId",
                Value: instanceId,
              },
            ],
          },

          Period: 3600,

          Stat: "Average",
        },

        ReturnData: true,
      },
    ],
  });

  const response = await cloudWatchClient.send(command);

  const values =
  response.MetricDataResults?.[0]?.Values || [];

return values;
};

module.exports = {
  getCPUUtilization,
};