const { getEC2Instances } = require("../aws/ec2.service");
const { getCPUUtilization } = require("../aws/cloudwatch.service");
const { getEC2Pricing } = require("../aws/pricing.service");

const {
  createScan,
  completeScan,
} = require("../database/scan.service");

const {
  saveResources,
} = require("../database/resource.service");

const {
  saveRecommendation,
} = require("../database/recommendation.service");

const {
  calculateAverageCPU,
} = require("../analyzer/cpu.analyzer");

const {
  getEC2Recommendation,
} = require("../recommender/ec2.recommender");

const {
  buildEC2PricingFilters,
} = require("../../builders/pricing.filter.builder");

const {
  extractHourlyPrice,
} = require("../../parser/pricing.parser");

const {
  calculateMonthlyCost,
  calculateEstimatedSavings,
} = require("../../calculator/savings.calculator");

const scanInfrastructure = async () => {
  // Step 1: Create Scan
  const scan = await createScan();

  // Step 2: Fetch EC2 Instances
  const ec2 = await getEC2Instances();

  // Step 3: Save Resources
  await saveResources(scan._id, ec2);

  // Step 4: Analyze Every Instance
  for (const instance of ec2) {
    // CloudWatch Metrics
    const cpuValues = await getCPUUtilization(
      instance.instanceId
    );

    // Average CPU
    const averageCPU =
      calculateAverageCPU(cpuValues);

    // Recommendation
    const recommendation =
      getEC2Recommendation(averageCPU);

    // Pricing Filters
    const pricingFilters =
      buildEC2PricingFilters(instance);

    // Pricing API
    const pricingResponse =
      await getEC2Pricing(pricingFilters);

    // Hourly Price
    const hourlyPrice =
      extractHourlyPrice(pricingResponse);

    // Monthly Cost
    const monthlyCost =
      calculateMonthlyCost(hourlyPrice);

    // Estimated Savings
    const estimatedSavings =
      calculateEstimatedSavings(
        monthlyCost,
        recommendation.action
      );

    // Save Recommendation
    await saveRecommendation({
      scanId: scan._id,

      resourceId: instance.instanceId,

      severity: recommendation.severity,

      action: recommendation.action,

      confidence: recommendation.confidence,

      recommendation:
        recommendation.recommendation,

      reason: recommendation.reason,

      hourlyPrice,

      monthlyCost,

      estimatedSavings,
    });

    // Logs
    console.log("=================================");
    console.log("Instance:", instance.instanceId);
    console.log("Average CPU:", averageCPU);
    console.log("Hourly Price:", hourlyPrice);
    console.log("Monthly Cost:", monthlyCost);
    console.log(
      "Estimated Savings:",
      estimatedSavings
    );
    console.log("Recommendation:", recommendation);
  }

  // Step 5: Complete Scan
  await completeScan(scan._id, ec2.length);

  return {
    scanId: scan._id,
    totalResources: ec2.length,
    ec2,
  };
};

module.exports = {
  scanInfrastructure,
};