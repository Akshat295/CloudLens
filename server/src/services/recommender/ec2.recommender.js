const getEC2Recommendation = (averageCPU) => {
  if (averageCPU < 5) {
    return {
      severity: "HIGH",

      action: "STOP",

      confidence: 95,

      recommendation:
        "Instance is underutilized. Consider stopping or downsizing it.",

      reason: `Average CPU utilization is only ${averageCPU.toFixed(
        2
      )}%`,
    };
  }

  if (averageCPU > 80) {
    return {
      severity: "MEDIUM",

      action: "UPSIZE",

      confidence: 90,

      recommendation:
        "Instance is heavily utilized. Consider upgrading the instance type.",

      reason: `Average CPU utilization is ${averageCPU.toFixed(
        2
      )}%`,
    };
  }

  return {
    severity: "LOW",

    action: "NONE",

    confidence: 99,

    recommendation:
      "Instance utilization is healthy.",

    reason: `Average CPU utilization is ${averageCPU.toFixed(
      2
    )}%`,
  };
};

module.exports = {
  getEC2Recommendation,
};