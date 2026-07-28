const { getEC2Instances } = require("../aws/ec2.service");
const { getCPUUtilization } = require("../aws/cloudwatch.service");
const { getEC2Pricing } = require("../aws/pricing.service");

const { saveResources } = require("../database/resource.repository");
const { saveRecommendation } = require("../database/recommendation.repository");

const { calculateAverageCPU } = require("../analyzer/cpu.analyzer");
const { getEC2Recommendation } = require("../recommender/ec2.recommender");

const { buildEC2PricingFilters } = require("../../builders/pricing.filter.builder");
const { extractHourlyPrice } = require("../../parser/pricing.parser");

const {
  calculateMonthlyCost,
  calculateEstimatedSavings,
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

const logInstanceScanResult = (instance, { averageCPU, hourlyPrice, monthlyCost, estimatedSavings, recommendation }) => {
  console.log("=================================");
  console.log("Instance:", instance.instanceId);
  console.log("Average CPU:", averageCPU);
  console.log("Hourly Price:", hourlyPrice);
  console.log("Monthly Cost:", monthlyCost);
  console.log("Estimated Savings:", estimatedSavings);
  console.log("Recommendation:", recommendation);
};

// Analyzes a single EC2 instance (CPU history, pricing, recommendation),
// persists its recommendation, and returns the savings it contributes.
const processInstance = async (scanId, instance) => {
  const cpuValues = await getCPUUtilization(instance.instanceId);
  const averageCPU = calculateAverageCPU(cpuValues);
  const recommendation = getEC2Recommendation(averageCPU);

  const pricingFilters = buildEC2PricingFilters(instance);
  const pricingResponse = await getEC2Pricing(pricingFilters);
  const hourlyPrice = extractHourlyPrice(pricingResponse);
  const monthlyCost = calculateMonthlyCost(hourlyPrice);
  const estimatedSavings = calculateEstimatedSavings(monthlyCost, recommendation.action);

  await saveRecommendation({
    scanId,
    resourceId: instance.instanceId,
    severity: recommendation.severity,
    action: recommendation.action,
    confidence: recommendation.confidence,
    recommendation: recommendation.recommendation,
    reason: recommendation.reason,
    hourlyPrice,
    monthlyCost,
    estimatedSavings,
  });

  logInstanceScanResult(instance, {
    averageCPU,
    hourlyPrice,
    monthlyCost,
    estimatedSavings,
    recommendation,
  });

  return estimatedSavings;
};

const scanEC2 = async (scanId) => {
  const ec2Instances = await getEC2Instances();

  await saveResources(scanId, "EC2", buildEC2ResourceRecords(ec2Instances));

  let totalSavings = 0;

  for (const instance of ec2Instances) {
    totalSavings += await processInstance(scanId, instance);
  }

  return {
    totalResources: ec2Instances.length,
    estimatedSavings: totalSavings,
    resources: ec2Instances,
  };
};

module.exports = {
  scanEC2,
};
