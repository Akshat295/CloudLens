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

// Maps a raw RDS `Engine` code (e.g. "aurora-postgresql", "sqlserver-se")
// to the Pricing API's `databaseEngine` filter value. Falls back to
// capitalizing the raw engine code for anything not explicitly listed.
const ENGINE_TO_PRICING_NAME = {
  mysql: "MySQL",
  postgres: "PostgreSQL",
  mariadb: "MariaDB",
  "oracle-se2": "Oracle",
  "oracle-se2-cdb": "Oracle",
  "oracle-ee": "Oracle",
  "oracle-ee-cdb": "Oracle",
  "sqlserver-ex": "SQL Server",
  "sqlserver-web": "SQL Server",
  "sqlserver-se": "SQL Server",
  "sqlserver-ee": "SQL Server",
  "aurora-mysql": "Aurora MySQL",
  "aurora-postgresql": "Aurora PostgreSQL",
};

const getPricingDatabaseEngine = (engine) =>
  ENGINE_TO_PRICING_NAME[engine] || (engine ? engine.charAt(0).toUpperCase() + engine.slice(1) : engine);

const buildRDSPricingFilters = (instance) => {
  return {
    instanceType: instance.instanceClass,

    location: getLocationFromAvailabilityZone(instance.availabilityZone),

    databaseEngine: getPricingDatabaseEngine(instance.engine),

    deploymentOption: instance.multiAZ ? "Multi-AZ" : "Single-AZ",
  };
};

module.exports = {
  buildEC2PricingFilters,
  buildS3PricingFilters,
  buildRDSPricingFilters,
};
