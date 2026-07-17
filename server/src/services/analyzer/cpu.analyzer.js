const calculateAverageCPU = (values = []) => {
  if (values.length === 0) {
    return 0;
  }

  const total = values.reduce((sum, value) => sum + value, 0);

  return Number((total / values.length).toFixed(2));
};

module.exports = {
  calculateAverageCPU,
};