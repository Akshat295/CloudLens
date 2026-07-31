const {
  getConnectionByUserId,
  testAwsConnection,
  connectAwsAccount,
  disconnectAwsAccount,
} = require("../services/awsConnection/awsConnection.service");
const { recordAuditLog } = require("../services/auditLog/auditLog.service");
const { AUDIT_ACTIONS } = require("../constants/auditActions");
const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/apiResponse");
const ApiError = require("../utils/ApiError");

const testConnection = asyncHandler(async (req, res) => {
  const { region, accessKeyId, secretAccessKey } = req.body;

  if (!region || !accessKeyId || !secretAccessKey) {
    throw new ApiError(400, "Region, Access Key ID and Secret Access Key are required");
  }

  const result = await testAwsConnection({ region, accessKeyId, secretAccessKey });

  sendSuccess(res, result);
});

const connect = asyncHandler(async (req, res) => {
  const { region, accessKeyId, secretAccessKey, accountAlias } = req.body;

  if (!region || !accessKeyId || !secretAccessKey) {
    throw new ApiError(400, "Region, Access Key ID and Secret Access Key are required");
  }

  const connection = await connectAwsAccount({
    userId: req.user.userId,
    region,
    accessKeyId,
    secretAccessKey,
    accountAlias,
  });

  await recordAuditLog(
    req.user.userId,
    AUDIT_ACTIONS.AWS_CONNECTED,
    `AWS account ${connection.accountId} (${connection.region}) connected`
  );

  sendSuccess(res, connection, 201);
});

const getAccount = asyncHandler(async (req, res) => {
  const connection = await getConnectionByUserId(req.user.userId);

  sendSuccess(res, connection);
});

const disconnect = asyncHandler(async (req, res) => {
  const connection = await disconnectAwsAccount(req.user.userId);

  await recordAuditLog(
    req.user.userId,
    AUDIT_ACTIONS.AWS_DISCONNECTED,
    `AWS account ${connection.accountId} disconnected`
  );

  sendSuccess(res, { disconnected: true });
});

module.exports = {
  testConnection,
  connect,
  getAccount,
  disconnect,
};
