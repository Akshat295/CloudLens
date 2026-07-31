import api from "../api/api";

export const getNotificationSettings = async () => {
  const response = await api.get("/notifications/settings");
  return response.data.data;
};

export const updateNotificationSettings = async (updates) => {
  const response = await api.patch("/notifications/settings", updates);
  return response.data.data;
};
