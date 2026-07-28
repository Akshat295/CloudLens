import api from "../api/api";

export const getDashboard = async () => {
  const response = await api.get("/dashboard");
  return response.data.data;
};

export const scanInfrastructure = async () => {
  const response = await api.post("/scan");
  return response.data;
};
