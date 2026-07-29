const calculateMonthlyCost = (hourlyPrice) => {
  return hourlyPrice * 24 * 30;
};

const calculateEstimatedSavings = (
  monthlyCost,
  action
) => {
  switch (action) {
    case "STOP":
      return monthlyCost;

    case "DOWNSIZE":
      return monthlyCost * 0.5;

    default:
      return 0;
  }
};

// Feature 8: cost comparison for the recommended action. `optimizedMonthlyCost`
// is only meaningful for UPSIZE/DOWNSIZE (the caller looks up pricing for the
// adjacent instance type); STOP always drives cost to zero, and anything else
// has no cheaper/pricier alternative to compare against.
const calculateCostComparison = (action, currentMonthlyCost, optimizedMonthlyCost) => {
  switch (action) {
    case "STOP":
      return {
        currentMonthlyCost,
        optimizedMonthlyCost: 0,
        monthlySavings: currentMonthlyCost,
      };

    case "UPSIZE":
    case "DOWNSIZE":
      return {
        currentMonthlyCost,
        optimizedMonthlyCost,
        monthlySavings: Number((currentMonthlyCost - optimizedMonthlyCost).toFixed(4)),
      };

    default:
      return {
        currentMonthlyCost,
        optimizedMonthlyCost: currentMonthlyCost,
        monthlySavings: 0,
      };
  }
};

module.exports = {
  calculateMonthlyCost,
  calculateEstimatedSavings,
  calculateCostComparison,
};