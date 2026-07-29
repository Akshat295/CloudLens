const { getEC2Instances, getEBSVolumes, getElasticIPAddresses } = require("../aws/ec2.service");
const { getCPUUtilization, getNetworkAndDiskMetrics } = require("../aws/cloudwatch.service");
const { getEC2Pricing } = require("../aws/pricing.service");

const { saveResources } = require("../database/resource.repository");
const { saveRecommendation } = require("../database/recommendation.repository");

const { calculateAverageCPU } = require("../analyzer/cpu.analyzer");
const {
  calculateInstanceAgeDays,
  analyzeNetworkUtilization,
  analyzeDiskIO,
  analyzeSecurityGroups,
  analyzeEBSVolumes,
  analyzeElasticIP,
} = require("../analyzer/ec2.analyzer");

const {
  getEC2Recommendation,
  getNetworkRecommendation,
  getDiskRecommendation,
  getInstanceAgeRecommendation,
  getSecurityGroupRecommendation,
  getEBSRecommendation,
  getElasticIPRecommendation,
  mergeEC2Recommendations,
} = require("../recommender/ec2.recommender");

const { buildEC2PricingFilters } = require("../../builders/pricing.filter.builder");
const { extractHourlyPrice } = require("../../parser/pricing.parser");
const { getAdjacentInstanceType } = require("../../utils/instanceType.util");

const {
  calculateMonthlyCost,
  calculateEstimatedSavings,
  calculateCostComparison,
} = require("../../calculator/savings.calculator");

// Maps mapped EC2 instances into the generic Resource shape expected by
// resource.repository.js's saveResources.
const buildEC2ResourceRecords = (instances) =>
  instances.map((instance) => ({
    resourceId: instance.instanceId,
    name: instance.name,
    state: instance.state,
    metadata: {
      instanceType: instance.instanceType,
      availabilityZone: instance.availabilityZone,
      publicIp: instance.publicIp,
      privateIp: instance.privateIp,
      launchTime: instance.launchTime,
    },
  }));

// Groups DescribeVolumes results by the instance they're attached to —
// fetched once per scan rather than once per instance.
const groupVolumesByInstance = (volumes) => {
  const map = new Map();

  for (const volume of volumes) {
    for (const attachment of volume.Attachments || []) {
      const instanceId = attachment.InstanceId;
      if (!instanceId) continue;

      if (!map.has(instanceId)) map.set(instanceId, []);
      map.get(instanceId).push(volume);
    }
  }

  return map;
};

// DescribeAddresses only returns addresses actually allocated (owned) in the
// account, so any instance ID that shows up here truly has an Elastic IP —
// anything else with a PublicIpAddress is just an ephemeral one.
const getElasticIPInstanceIds = (addresses) =>
  new Set(addresses.map((address) => address.InstanceId).filter(Boolean));

// A second pricing lookup for the adjacent instance type (Feature 8). Falls
// back to the current monthly cost — meaning "no known change" — whenever
// the target type can't be determined or its price can't be fetched, rather
// than guessing.
const getOptimizedMonthlyCost = async (instance, action, currentMonthlyCost) => {
  if (action !== "UPSIZE" && action !== "DOWNSIZE") return currentMonthlyCost;

  const targetInstanceType = getAdjacentInstanceType(instance.instanceType, action === "UPSIZE" ? "up" : "down");
  if (!targetInstanceType) return currentMonthlyCost;

  try {
    const pricingFilters = buildEC2PricingFilters({ ...instance, instanceType: targetInstanceType });
    const pricingResponse = await getEC2Pricing(pricingFilters);
    const hourlyPrice = extractHourlyPrice(pricingResponse);

    return hourlyPrice > 0 ? calculateMonthlyCost(hourlyPrice) : currentMonthlyCost;
  } catch (error) {
    console.warn(`Could not fetch pricing for ${targetInstanceType}:`, error.message);
    return currentMonthlyCost;
  }
};

const logInstanceScanResult = (
  instance,
  { averageCPU, hourlyPrice, monthlyCost, estimatedSavings, networkAnalysis, diskAnalysis, instanceAgeDays, securityGroupAnalysis, ebsAnalysis, elasticIpStatus, costComparison, mergedRecommendation }
) => {
  console.log("=================================");
  console.log("Instance:", instance.instanceId);
  console.log("Average CPU:", averageCPU);
  console.log("Hourly Price:", hourlyPrice);
  console.log("Monthly Cost:", monthlyCost);
  console.log("Estimated Savings:", estimatedSavings);
  console.log("Network:", networkAnalysis);
  console.log("Disk:", diskAnalysis);
  console.log("Instance Age (days):", instanceAgeDays);
  console.log("Security Groups:", securityGroupAnalysis);
  console.log("EBS Volumes:", ebsAnalysis);
  console.log("Elastic IP:", elasticIpStatus);
  console.log("Cost Comparison:", costComparison);
  console.log("Recommendation:", mergedRecommendation);
};

// Analyzes a single EC2 instance (CPU, network, disk, age, security groups,
// EBS volumes, Elastic IP, pricing), persists ONE merged recommendation for
// it, and returns the enriched Resource record + savings it contributes.
const processInstance = async (scanId, instance, volumesByInstance, elasticIpInstanceIds) => {
  const [cpuValues, extendedMetrics, pricingResponse] = await Promise.all([
    getCPUUtilization(instance.instanceId),
    getNetworkAndDiskMetrics(instance.instanceId),
    getEC2Pricing(buildEC2PricingFilters(instance)),
  ]);

  const averageCPU = calculateAverageCPU(cpuValues);
  const networkAnalysis = analyzeNetworkUtilization(extendedMetrics);
  const diskAnalysis = analyzeDiskIO(extendedMetrics);
  const instanceAgeDays = calculateInstanceAgeDays(instance.launchTime);
  const securityGroupAnalysis = analyzeSecurityGroups(instance.securityGroups);

  const instanceVolumes = volumesByInstance.get(instance.instanceId) || [];
  const ebsAnalysis = analyzeEBSVolumes(instanceVolumes);

  const elasticIpStatus = analyzeElasticIP({
    publicIp: instance.publicIp,
    isAssociated: elasticIpInstanceIds.has(instance.instanceId),
  });

  const hourlyPrice = extractHourlyPrice(pricingResponse);
  const monthlyCost = calculateMonthlyCost(hourlyPrice);

  const baseRecommendation = getEC2Recommendation({
    averageCPU,
    avgNetworkIn: networkAnalysis.avgNetworkIn,
    avgNetworkOut: networkAnalysis.avgNetworkOut,
    diskTotal: diskAnalysis.avgDiskReadBytes + diskAnalysis.avgDiskWriteBytes,
    instanceAgeDays,
  });

  const estimatedSavings = calculateEstimatedSavings(monthlyCost, baseRecommendation.action);

  const networkRecommendation = getNetworkRecommendation({
    averageCPU,
    avgNetworkIn: networkAnalysis.avgNetworkIn,
    avgNetworkOut: networkAnalysis.avgNetworkOut,
  });

  const diskRecommendation = getDiskRecommendation({
    averageCPU,
    avgNetworkIn: networkAnalysis.avgNetworkIn,
    avgNetworkOut: networkAnalysis.avgNetworkOut,
    diskAnalysis,
  });

  const ageRecommendation = getInstanceAgeRecommendation(instanceAgeDays);
  const securityGroupRecommendation = getSecurityGroupRecommendation(securityGroupAnalysis);
  const ebsRecommendation = getEBSRecommendation(ebsAnalysis);
  const elasticIpRecommendation = getElasticIPRecommendation(elasticIpStatus);

  const optimizedMonthlyCost = await getOptimizedMonthlyCost(instance, baseRecommendation.action, monthlyCost);
  const costComparison = calculateCostComparison(baseRecommendation.action, monthlyCost, optimizedMonthlyCost);

  const mergedRecommendation = mergeEC2Recommendations({
    baseRecommendation,
    networkRecommendation,
    diskRecommendation,
    ageRecommendation,
    securityGroupRecommendation,
    ebsRecommendation,
    elasticIpRecommendation,
    monthlyCost,
    estimatedSavings,
  });

  await saveRecommendation({
    scanId,
    resourceId: instance.instanceId,
    severity: mergedRecommendation.severity,
    action: mergedRecommendation.action,
    confidence: mergedRecommendation.confidence,
    recommendation: mergedRecommendation.recommendation,
    reason: mergedRecommendation.reason,
    hourlyPrice,
    monthlyCost: mergedRecommendation.monthlyCost,
    estimatedSavings: mergedRecommendation.estimatedSavings,
  });

  logInstanceScanResult(instance, {
    averageCPU,
    hourlyPrice,
    monthlyCost,
    estimatedSavings,
    networkAnalysis,
    diskAnalysis,
    instanceAgeDays,
    securityGroupAnalysis,
    ebsAnalysis,
    elasticIpStatus,
    costComparison,
    mergedRecommendation,
  });

  const [baseResourceRecord] = buildEC2ResourceRecords([instance]);

  return {
    estimatedSavings,
    resource: {
      ...baseResourceRecord,
      metadata: {
        ...baseResourceRecord.metadata,
        averageCpu: averageCPU,
        networkIn: networkAnalysis.avgNetworkIn,
        networkOut: networkAnalysis.avgNetworkOut,
        diskReadBytes: diskAnalysis.avgDiskReadBytes,
        diskWriteBytes: diskAnalysis.avgDiskWriteBytes,
        diskReadOps: diskAnalysis.avgDiskReadOps,
        diskWriteOps: diskAnalysis.avgDiskWriteOps,
        instanceAgeDays,
        securityGroups: securityGroupAnalysis.groups,
        volumeCount: ebsAnalysis.volumeCount,
        volumeIds: ebsAnalysis.volumeIds,
        volumeTypes: ebsAnalysis.volumeTypes,
        encrypted: ebsAnalysis.encrypted,
        elasticIp: elasticIpStatus,
        costComparison,
      },
    },
  };
};

const scanEC2 = async (scanId) => {
  const [ec2Instances, volumes, elasticIpAddresses] = await Promise.all([
    getEC2Instances(),
    getEBSVolumes(),
    getElasticIPAddresses(),
  ]);

  const volumesByInstance = groupVolumesByInstance(volumes);
  const elasticIpInstanceIds = getElasticIPInstanceIds(elasticIpAddresses);

  const instanceResources = [];
  let totalSavings = 0;

  for (const instance of ec2Instances) {
    const { resource, estimatedSavings } = await processInstance(
      scanId,
      instance,
      volumesByInstance,
      elasticIpInstanceIds
    );

    instanceResources.push(resource);
    totalSavings += estimatedSavings;
  }

  await saveResources(scanId, "EC2", instanceResources);

  return {
    totalResources: ec2Instances.length,
    estimatedSavings: totalSavings,
    resources: ec2Instances,
  };
};

module.exports = {
  scanEC2,
};
