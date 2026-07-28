import api from "../api/api";

export const getRecommendations = async () => {
  const response = await api.get("/recommendations");
  return response.data.data;
};

export const ignoreRecommendation = async (id) => {
  const response = await api.patch(
    `/recommendations/${id}/ignore`
  );
  return response.data.data;
};

export const resolveRecommendation = async (id) => {
  const response = await api.patch(
    `/recommendations/${id}/resolve`
  );
  return response.data.data;
};

export const stopRecommendation = async (id) => {
  const response = await api.post(
    `/recommendations/${id}/stop`
  );
  return response.data.data;
};