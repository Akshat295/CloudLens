const { REGIONS } = require("../constants/regions");

const getLocationFromAvailabilityZone = (
  availabilityZone
) => {
  const region = availabilityZone.slice(0, -1);

  return REGIONS[region];
};

// S3 buckets expose a region code directly (via GetBucketLocation), unlike
// EC2 instances which only expose an availability zone.
const getLocationFromRegion = (region) => REGIONS[region];

module.exports = {
  getLocationFromAvailabilityZone,
  getLocationFromRegion,
};
