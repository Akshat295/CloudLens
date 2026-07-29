const {
  GetMetricDataCommand,
} = require("@aws-sdk/client-cloudwatch");

const { cloudWatchClient } = require("../../config/aws");

// Shared 7-day lookback window, extracted so every EC2/S3 metric query
// (CPU, network, disk, storage) samples the exact same period.
const getSevenDayWindow = () => {
  const endTime = new Date();

  const startTime = new Date();
  startTime.setDate(startTime.getDate() - 7);

  return { startTime, endTime };
};

const getCPUUtilization = async (instanceId) => {
  const { startTime, endTime } = getSevenDayWindow();

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

// S3 publishes BucketSizeBytes/NumberOfObjects once per day (CloudWatch's
// free "daily storage metrics", enabled by default for every bucket — no
// request-metrics opt-in needed), so a 7-day lookback window comfortably
// covers AWS's documented up-to-48h publish delay. GetMetricData defaults to
// ScanBy: "TimestampDescending", so Values[0] is the most recent sample.
//
// BucketSizeBytes is queried once per tracked storage class (via the
// StorageType dimension) rather than just "StandardStorage" — this is what
// lets analyzeStorageClassDistribution below see how a bucket's data is
// actually spread across tiers. `bucketSizeBytes` (the top-level field used
// by storage.calculator.js's cost estimate, which prices everything at the
// Standard rate) is intentionally left as just the STANDARD figure, exactly
// as before — the per-class breakdown is additive, not a redefinition of
// it. Object count uses "AllStorageTypes", a genuine complete total across
// every storage class (including ones not individually tracked here).
const STORAGE_CLASS_METRICS = [
  { storageClass: "STANDARD", storageType: "StandardStorage", queryId: "sizeStandard" },
  { storageClass: "STANDARD_IA", storageType: "StandardIAStorage", queryId: "sizeStandardIa" },
  { storageClass: "ONEZONE_IA", storageType: "OneZoneIAStorage", queryId: "sizeOnezoneIa" },
  { storageClass: "GLACIER", storageType: "GlacierStorage", queryId: "sizeGlacier" },
  { storageClass: "DEEP_ARCHIVE", storageType: "DeepArchiveStorage", queryId: "sizeDeepArchive" },
];

const EMPTY_STORAGE_CLASS_BYTES = STORAGE_CLASS_METRICS.reduce(
  (acc, { storageClass }) => ({ ...acc, [storageClass]: 0 }),
  {}
);

const buildBucketSizeQuery = (bucketName, queryId, storageType) => ({
  Id: queryId,

  MetricStat: {
    Metric: {
      Namespace: "AWS/S3",

      MetricName: "BucketSizeBytes",

      Dimensions: [
        { Name: "BucketName", Value: bucketName },
        { Name: "StorageType", Value: storageType },
      ],
    },

    Period: 86400,

    Stat: "Average",
  },

  ReturnData: true,
});

const getS3StorageMetrics = async (bucketName) => {
  const { startTime, endTime } = getSevenDayWindow();

  const command = new GetMetricDataCommand({
    StartTime: startTime,
    EndTime: endTime,

    MetricDataQueries: [
      {
        Id: "objectCount",

        MetricStat: {
          Metric: {
            Namespace: "AWS/S3",

            MetricName: "NumberOfObjects",

            Dimensions: [
              { Name: "BucketName", Value: bucketName },
              { Name: "StorageType", Value: "AllStorageTypes" },
            ],
          },

          Period: 86400,

          Stat: "Average",
        },

        ReturnData: true,
      },

      ...STORAGE_CLASS_METRICS.map(({ queryId, storageType }) =>
        buildBucketSizeQuery(bucketName, queryId, storageType)
      ),
    ],
  });

  try {
    const response = await cloudWatchClient.send(command);

    const results = response.MetricDataResults || [];
    const getValue = (id) => results.find((result) => result.Id === id)?.Values?.[0] || 0;

    const storageClassBytes = {};
    STORAGE_CLASS_METRICS.forEach(({ storageClass, queryId }) => {
      storageClassBytes[storageClass] = getValue(queryId);
    });

    return {
      bucketSizeBytes: storageClassBytes.STANDARD,
      objectCount: Math.round(getValue("objectCount")),
      storageClassBytes,
    };
  } catch (error) {
    console.warn(`Could not fetch storage metrics for bucket ${bucketName}:`, error.message);
    return { bucketSizeBytes: 0, objectCount: 0, storageClassBytes: { ...EMPTY_STORAGE_CLASS_BYTES } };
  }
};

// DiskRead/WriteBytes/Ops are only published by CloudWatch for instance-store
// backed instances — most EC2 instances are EBS-backed and will simply have
// no datapoints for these, which resolves to empty arrays (handled the same
// way as any other missing-metric case, not as an error).
const NETWORK_AND_DISK_METRICS = [
  { queryId: "networkIn", metricName: "NetworkIn" },
  { queryId: "networkOut", metricName: "NetworkOut" },
  { queryId: "diskReadBytes", metricName: "DiskReadBytes" },
  { queryId: "diskWriteBytes", metricName: "DiskWriteBytes" },
  { queryId: "diskReadOps", metricName: "DiskReadOps" },
  { queryId: "diskWriteOps", metricName: "DiskWriteOps" },
];

const EMPTY_NETWORK_AND_DISK_VALUES = NETWORK_AND_DISK_METRICS.reduce(
  (acc, { queryId }) => ({ ...acc, [`${queryId}Values`]: [] }),
  {}
);

const getNetworkAndDiskMetrics = async (instanceId) => {
  const { startTime, endTime } = getSevenDayWindow();

  const command = new GetMetricDataCommand({
    StartTime: startTime,
    EndTime: endTime,

    MetricDataQueries: NETWORK_AND_DISK_METRICS.map(({ queryId, metricName }) => ({
      Id: queryId,

      MetricStat: {
        Metric: {
          Namespace: "AWS/EC2",
          MetricName: metricName,
          Dimensions: [{ Name: "InstanceId", Value: instanceId }],
        },

        Period: 3600,

        Stat: "Average",
      },

      ReturnData: true,
    })),
  });

  try {
    const response = await cloudWatchClient.send(command);

    const results = response.MetricDataResults || [];
    const getValues = (id) => results.find((result) => result.Id === id)?.Values || [];

    const values = {};
    NETWORK_AND_DISK_METRICS.forEach(({ queryId }) => {
      values[`${queryId}Values`] = getValues(queryId);
    });

    return values;
  } catch (error) {
    console.warn(`Could not fetch network/disk metrics for instance ${instanceId}:`, error.message);
    return { ...EMPTY_NETWORK_AND_DISK_VALUES };
  }
};

const getRDSCPUUtilization = async (dbInstanceIdentifier) => {
  const { startTime, endTime } = getSevenDayWindow();

  const command = new GetMetricDataCommand({
    StartTime: startTime,
    EndTime: endTime,

    MetricDataQueries: [
      {
        Id: "cpu",

        MetricStat: {
          Metric: {
            Namespace: "AWS/RDS",

            MetricName: "CPUUtilization",

            Dimensions: [
              {
                Name: "DBInstanceIdentifier",
                Value: dbInstanceIdentifier,
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

  try {
    const response = await cloudWatchClient.send(command);

    return response.MetricDataResults?.[0]?.Values || [];
  } catch (error) {
    console.warn(`Could not fetch CPU utilization for DB instance ${dbInstanceIdentifier}:`, error.message);
    return [];
  }
};

module.exports = {
  getCPUUtilization,
  getS3StorageMetrics,
  getNetworkAndDiskMetrics,
  getRDSCPUUtilization,
};