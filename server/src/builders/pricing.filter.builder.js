const {
  getLocationFromAvailabilityZone,
  getLocationFromRegion,
} = require("../utils/region.util");

const buildEC2PricingFilters = (instance) => {
  return {
    instanceType: instance.instanceType,

    location: getLocationFromAvailabilityZone(
      instance.availabilityZone
    ),

    operatingSystem: "Linux",

    tenancy: "Shared",

    capacityStatus: "Used",

    preInstalledSw: "NA",
  };
};

const buildS3PricingFilters = (region) => {
  return {
    location: getLocationFromRegion(region),

    volumeType: "Standard",
  };
};

module.exports = {
  buildEC2PricingFilters,
  buildS3PricingFilters,
};
