const { REGIONS } = require("../constants/regions");

const getLocationFromAvailabilityZone = (
  availabilityZone
) => {
  const region = availabilityZone.slice(0, -1);

  return REGIONS[region];
};

module.exports = {
  getLocationFromAvailabilityZone,
};