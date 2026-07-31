const AwsConnection = require("../models/AwsConnection");
const { decrypt } = require("../utils/encryption");
const {
  createEC2Client,
  createCloudWatchClient,
  createPricingClient,
  createS3Client,
  createRDSClient,
  createIAMClient,
} = require("../config/aws");

// The single request-scoped entry point for obtaining AWS SDK clients: loads
// the calling user's connected AWS account, decrypts its stored secret, and
// builds a fresh set of clients from those credentials — never a shared
// global client, and never credentials read straight out of .env.
//
// A user with no connected AwsConnection yet resolves to `undefined`
// credentials, which every create*Client() call already treats as "fall
// back to the SDK's own default provider chain" — preserving scan behavior
// for a user who hasn't connected an account yet.
const getAwsClientsForUser = async (userId) => {
  const connection = await AwsConnection.findOne({ userId });

  const credentials = connection
    ? {
        accessKeyId: connection.accessKeyId,
        secretAccessKey: decrypt(connection.encryptedSecretKey),
      }
    : undefined;

  const region = connection?.region;

  return {
    ec2Client: createEC2Client(credentials, region),
    cloudWatchClient: createCloudWatchClient(credentials, region),
    pricingClient: createPricingClient(credentials),
    s3Client: createS3Client(credentials, region),
    rdsClient: createRDSClient(credentials, region),
    iamClient: createIAMClient(credentials, region),
  };
};

module.exports = {
  getAwsClientsForUser,
};
