const AwsConnection = require("../../models/AwsConnection");
const ApiError = require("../../utils/ApiError");
const { encrypt } = require("../../utils/encryption");
const { validateAwsCredentials } = require("../aws/sts.service");

const getConnectionByUserId = async (userId) => {
  return await AwsConnection.findOne({ userId }).select("-encryptedSecretKey");
};

// Validates credentials via STS without persisting anything — lets the
// frontend confirm a set of credentials works before the user commits to
// saving them.
const testAwsConnection = async ({ region, accessKeyId, secretAccessKey }) => {
  const validation = await validateAwsCredentials({ accessKeyId, secretAccessKey, region });

  if (!validation.valid) {
    throw new ApiError(400, "Invalid AWS credentials. Please check your Access Key ID, Secret Access Key, and Region.");
  }

  return {
    accountId: validation.accountId,
    arn: validation.arn,
    region,
  };
};

const connectAwsAccount = async ({ userId, region, accessKeyId, secretAccessKey, accountAlias }) => {
  const existing = await AwsConnection.findOne({ userId });

  if (existing) {
    throw new ApiError(409, "An AWS account is already connected. Disconnect it before connecting a new one.");
  }

  const validation = await validateAwsCredentials({ accessKeyId, secretAccessKey, region });

  if (!validation.valid) {
    throw new ApiError(400, "Invalid AWS credentials. Please check your Access Key ID, Secret Access Key, and Region.");
  }

  const now = new Date();

  const connection = await AwsConnection.create({
    userId,
    accountId: validation.accountId,
    accountAlias,
    region,
    accessKeyId,
    encryptedSecretKey: encrypt(secretAccessKey),
    status: "CONNECTED",
    connectedAt: now,
    lastValidatedAt: now,
  });

  const connectionObject = connection.toObject();
  delete connectionObject.encryptedSecretKey;

  return connectionObject;
};

const disconnectAwsAccount = async (userId) => {
  const connection = await AwsConnection.findOneAndDelete({ userId });

  if (!connection) {
    throw new ApiError(404, "No AWS account is connected.");
  }

  return connection;
};

module.exports = {
  getConnectionByUserId,
  testAwsConnection,
  connectAwsAccount,
  disconnectAwsAccount,
};
