const { GetCallerIdentityCommand } = require("@aws-sdk/client-sts");
const { createSTSClient } = require("../../config/aws");

const validateAwsCredentials = async ({ accessKeyId, secretAccessKey, region }) => {
  const stsClient = createSTSClient({ accessKeyId, secretAccessKey }, region);

  try {
    const response = await stsClient.send(new GetCallerIdentityCommand({}));

    return {
      valid: true,
      accountId: response.Account,
      arn: response.Arn,
    };
  } catch (error) {
    return {
      valid: false,
    };
  }
};

module.exports = {
  validateAwsCredentials,
};
