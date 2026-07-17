const {
  getDashboardSummary,
} = require("../database/dashboard.repository");

const getDashboardData = async () => {
  return await getDashboardSummary();
};

module.exports = {
  getDashboardData,
};