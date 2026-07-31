import api from "../api/api";

export const getCostTrend = async () => {
  const response = await api.get("/analytics/cost-trend");
  return response.data.data;
};

export const getSavingsTrend = async () => {
  const response = await api.get("/analytics/savings-trend");
  return response.data.data;
};

export const getResourceGrowth = async () => {
  const response = await api.get("/analytics/resource-growth");
  return response.data.data;
};

export const getHighAlertsTrend = async () => {
  const response = await api.get("/analytics/high-alerts-trend");
  return response.data.data;
};
