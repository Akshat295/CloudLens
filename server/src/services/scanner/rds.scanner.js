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
const processDBInstance = async (scanId, instance) => {
  const [cpuValues, pricingResponse] = await Promise.all([
    getRDSCPUUtilization(instance.dbInstanceIdentifier),
    getRDSPricing(buildRDSPricingFilters(instance)),
  ]);

  const averageCPU = calculateAverageCPU(cpuValues);
  const hourlyPrice = extractHourlyPrice(pricingResponse);
  const monthlyCost = calculateRDSMonthlyCost(hourlyPrice, instance.allocatedStorage);

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
  const cpuRecommendation = getRDSCPURecommendation(analysis);
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

const scanRDS = async (scanId) => {
  const dbInstances = await getDBInstances();

  const instanceResources = [];
  let totalSavings = 0;

  for (const instance of dbInstances) {
    const { resource, estimatedSavings } = await processDBInstance(scanId, instance);

    instanceResources.push(resource);
    totalSavings += estimatedSavings;
  }

  await saveResources(scanId, "RDS", instanceResources);

  return {
    totalResources: dbInstances.length,
    estimatedSavings: totalSavings,
    resources: dbInstances,
  };
};

module.exports = {
  scanRDS,
};
