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

module.exports = {
  calculateMonthlyCost,
  calculateEstimatedSavings,
};