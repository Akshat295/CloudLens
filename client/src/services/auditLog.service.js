import api from "../api/api";

export const getAuditLogs = async () => {
  const response = await api.get("/audit-logs");
  return response.data.data;
};
