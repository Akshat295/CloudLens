import api from "../api/api";

export const login = async (email, password) => {
  const response = await api.post("/auth/login", { email, password });
  return response.data;
};

export const signup = async (fullName, email, password) => {
  const response = await api.post("/auth/signup", { fullName, email, password });
  return response.data;
};
