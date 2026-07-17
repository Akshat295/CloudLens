const {
  getLocationFromAvailabilityZone,
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

module.exports = {
  buildEC2PricingFilters,
};