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
  const endTime = new Date();

  const startTime = new Date();
  startTime.setDate(startTime.getDate() - 7);

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

module.exports = {
  getCPUUtilization,
  getS3StorageMetrics,
};