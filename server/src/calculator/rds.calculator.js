const { calculateMonthlyCost } = require("./savings.calculator");

// RDS storage is billed separately from compute (per GB-month), but unlike
// S3's single, reliably-filterable "Standard" storage SKU, RDS storage
// pricing splits across storage type/engine/deployment-option in a way
// that's far less consistently queryable via GetProducts. Rather than a
// fragile second live pricing call, a flat approximate gp2/us-east-1 rate is
// used here — the same fallback-constant approach storage.calculator.js
// already uses for S3.
const RDS_STORAGE_FALLBACK_PRICE_PER_GB = 0.115;

const calculateRDSMonthlyCost = (hourlyPrice, allocatedStorageGB) => {
  const instanceCost = calculateMonthlyCost(hourlyPrice);
  const storageCost = (allocatedStorageGB || 0) * RDS_STORAGE_FALLBACK_PRICE_PER_GB;

  return Number((instanceCost + storageCost).toFixed(2));
};

const calculateRDSEstimatedSavings = (monthlyCost, savingsRate) => {
  return Number((monthlyCost * savingsRate).toFixed(2));
};

module.exports = {
  calculateRDSMonthlyCost,
  calculateRDSEstimatedSavings,
};
