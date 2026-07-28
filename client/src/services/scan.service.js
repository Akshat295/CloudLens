import api from "../api/api";

export const getScans = async () => {
  const response = await api.get("/scans");
  return response.data.data;
};

export const getScanById = async (id) => {
  const response = await api.get(`/scans/${id}`);
  return response.data.data;
};
