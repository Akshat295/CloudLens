import api from "../api/api";

// The backend supports one schedule per user and returns it as a 0/1-item
// array (GET /api/schedules) — unwrapped here so every page just deals with
// a single schedule object or null.
export const getSchedule = async () => {
  const response = await api.get("/schedules");
  const schedules = response.data.data || [];
  return schedules[0] || null;
};

export const createSchedule = async ({ frequency, enabled }) => {
  const response = await api.post("/schedules", { frequency, enabled });
  return response.data.data;
};

export const updateSchedule = async (id, updates) => {
  const response = await api.patch(`/schedules/${id}`, updates);
  return response.data.data;
};

export const deleteSchedule = async (id) => {
  await api.delete(`/schedules/${id}`);
};
