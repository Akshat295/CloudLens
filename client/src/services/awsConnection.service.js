import api from "../api/api";

export const getAwsConnection = async () => {
  const response = await api.get("/aws/account");
  return response.data.data;
};

export const testAwsConnection = async ({ region, accessKeyId, secretAccessKey }) => {
  const response = await api.post("/aws/test-connection", { region, accessKeyId, secretAccessKey });
  return response.data.data;
};

export const connectAwsAccount = async ({ region, accessKeyId, secretAccessKey, accountAlias }) => {
  const response = await api.post("/aws/connect", { region, accessKeyId, secretAccessKey, accountAlias });
  return response.data.data;
};

export const disconnectAwsAccount = async () => {
  const response = await api.delete("/aws/disconnect");
  return response.data.data;
};
