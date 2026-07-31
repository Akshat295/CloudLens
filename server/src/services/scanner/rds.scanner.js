const { getDBInstances } = require("../aws/rds.service");
const { getRDSCPUUtilization } = require("../aws/cloudwatch.service");
const { getRDSPricing } = require("../aws/pricing.service");

const { saveResources } = require("../database/resource.repository");
const { saveRecommendation } = require("../database/recommendation.repository");

const { calculateAverageCPU } = require("../analyzer/cpu.analyzer");
const { analyzeRDSConfiguration } = require("../analyzer/rds.analyzer");
const {
  getRDSPublicAccessRecommendation,
  getRDSEncryptionRecommendation,
  getRDSBackupRecommendation,
  getRDSMultiAZRecommendation,
  getRDSCPURecommendation,
  getRDSStorageTypeRecommendation,
  getRDSEngineVersionRecommendation,
  mergeRDSRecommendations,
} = require("../recommender/rds.recommender");

const { buildRDSPricingFilters } = require("../../builders/pricing.filter.builder");
const { extractHourlyPrice } = require("../../parser/pricing.parser");

const {
  calculateRDSMonthlyCost,
  calculateRDSEstimatedSavings,
} = require("../../calculator/rds.calculator");

const logInstanceScanResult = (instance, { analysis, hourlyPrice, monthlyCost, estimatedSavings, mergedRecommendation }) => {
  console.log("=================================");
  console.log("DB Instance:", instance.dbInstanceIdentifier);
  console.log("Analysis:", analysis);
  console.log("Hourly Price:", hourlyPrice);
  console.log("Monthly Cost:", monthlyCost);
  console.log("Estimated Savings:", estimatedSavings);
  console.log("Recommendation:", mergedRecommendation);
};

// Analyzes a single DB instance (config/security flags + CloudWatch CPU +
// pricing), persists ONE merged recommendation for it (mirroring the
// established one-resource-one-recommendation shape from EC2/S3), and
// returns the Resource record + savings it contributes.
const processDBInstance = async (scanId, userId, clients, instance) => {
  const { cloudWatchClient, pricingClient } = clients;

  const [cpuValues, pricingResponse] = await Promise.all([
    getRDSCPUUtilization(cloudWatchClient, instance.dbInstanceIdentifier),
    getRDSPricing(pricingClient, buildRDSPricingFilters(instance)),
  ]);

  const averageCPU = calculateAverageCPU(cpuValues);
  const hourlyPrice = extractHourlyPrice(pricingResponse);

  // A stopped RDS instance has no CloudWatch datapoints (averageCPU reads as
  // 0, indistinguishable from "running but idle") and isn't being billed for
  // compute — only its storage cost, if any, keeps accruing. Same root
  // cause/fix as the EC2 stopped-instance bug.
  const isRunning = instance.status === "available";
  const monthlyCost = calculateRDSMonthlyCost(isRunning ? hourlyPrice : 0, instance.allocatedStorage);

  const analysis = analyzeRDSConfiguration({
    publiclyAccessible: instance.publiclyAccessible,
    storageEncrypted: instance.storageEncrypted,
    backupRetentionPeriod: instance.backupRetentionPeriod,
    multiAZ: instance.multiAZ,
    storageType: instance.storageType,
    engine: instance.engine,
    engineVersion: instance.engineVersion,
    averageCPU,
  });

  const publicAccessRecommendation = getRDSPublicAccessRecommendation(analysis.publiclyAccessible);
  const encryptionRecommendation = getRDSEncryptionRecommendation(analysis.storageEncrypted);
  const backupRecommendation = getRDSBackupRecommendation(analysis);
  const multiAZRecommendation = getRDSMultiAZRecommendation(analysis.multiAZ);
  const cpuRecommendation = getRDSCPURecommendation({ ...analysis, isRunning });
  const storageTypeRecommendation = getRDSStorageTypeRecommendation(analysis.isGp2);
  const engineVersionRecommendation = getRDSEngineVersionRecommendation({
    engineVersionIsOld: analysis.engineVersionIsOld,
    engine: instance.engine,
    engineVersion: instance.engineVersion,
  });

  const estimatedSavings = calculateRDSEstimatedSavings(monthlyCost, cpuRecommendation.savingsRate || 0);

  const mergedRecommendation = mergeRDSRecommendations({
    publicAccessRecommendation,
    encryptionRecommendation,
    backupRecommendation,
    multiAZRecommendation,
    cpuRecommendation,
    storageTypeRecommendation,
    engineVersionRecommendation,
    monthlyCost,
    estimatedSavings,
  });

  await saveRecommendation({
    scanId,
    userId,
    resourceId: instance.dbInstanceIdentifier,
    severity: mergedRecommendation.severity,
    action: mergedRecommendation.action,
    confidence: mergedRecommendation.confidence,
    recommendation: mergedRecommendation.recommendation,
    reason: mergedRecommendation.reason,
    hourlyPrice,
    monthlyCost: mergedRecommendation.monthlyCost,
    estimatedSavings: mergedRecommendation.estimatedSavings,
  });

  logInstanceScanResult(instance, { analysis, hourlyPrice, monthlyCost, estimatedSavings, mergedRecommendation });

  return {
    estimatedSavings,
    resource: {
      resourceId: instance.dbInstanceIdentifier,
      name: instance.dbInstanceIdentifier,
      state: instance.status,
      metadata: {
        dbInstanceArn: instance.dbInstanceArn,
        engine: instance.engine,
        engineVersion: instance.engineVersion,
        instanceClass: instance.instanceClass,
        storageType: instance.storageType,
        allocatedStorage: instance.allocatedStorage,
        multiAZ: instance.multiAZ,
        publiclyAccessible: instance.publiclyAccessible,
        backupRetentionPeriod: instance.backupRetentionPeriod,
        storageEncrypted: instance.storageEncrypted,
        status: instance.status,
        endpoint: instance.endpoint,
        availabilityZone: instance.availabilityZone,
        averageCpu: averageCPU,
        monthlyCost,
      },
    },
  };
};

const scanRDS = async (scanId, userId, clients) => {
  const { rdsClient } = clients;

  const dbInstances = await getDBInstances(rdsClient);

  const instanceResources = [];
  let totalSavings = 0;

  for (const instance of dbInstances) {
    const { resource, estimatedSavings } = await processDBInstance(scanId, userId, clients, instance);

    instanceResources.push(resource);
    totalSavings += estimatedSavings;
  }

  await saveResources(scanId, "RDS", instanceResources, userId);

  return {
    totalResources: dbInstances.length,
    estimatedSavings: totalSavings,
    resources: dbInstances,
  };
};

module.exports = {
  scanRDS,
};
