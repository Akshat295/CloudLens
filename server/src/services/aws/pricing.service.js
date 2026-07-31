const {
  GetProductsCommand,
} = require("@aws-sdk/client-pricing");

const getEC2Pricing = async (pricingClient, pricingFilters) => {
  const command = new GetProductsCommand({
    ServiceCode: "AmazonEC2",

    Filters: [
      {
        Type: "TERM_MATCH",
        Field: "instanceType",
        Value: pricingFilters.instanceType,
      },
      {
        Type: "TERM_MATCH",
        Field: "location",
        Value: pricingFilters.location,
      },
      {
        Type: "TERM_MATCH",
        Field: "operatingSystem",
        Value: pricingFilters.operatingSystem,
      },
      {
        Type: "TERM_MATCH",
        Field: "tenancy",
        Value: pricingFilters.tenancy,
      },
      {
        Type: "TERM_MATCH",
        Field: "capacitystatus",
        Value: pricingFilters.capacityStatus,
      },
      {
        Type: "TERM_MATCH",
        Field: "preInstalledSw",
        Value: pricingFilters.preInstalledSw,
      },
    ],

    MaxResults: 1,
  });

  const response = await pricingClient.send(command);

  return response;
};

const getS3Pricing = async (pricingClient, pricingFilters) => {
  const command = new GetProductsCommand({
    ServiceCode: "AmazonS3",

    Filters: [
      {
        Type: "TERM_MATCH",
        Field: "productFamily",
        Value: "Storage",
      },
      {
        Type: "TERM_MATCH",
        Field: "volumeType",
        Value: pricingFilters.volumeType,
      },
      {
        Type: "TERM_MATCH",
        Field: "location",
        Value: pricingFilters.location,
      },
    ],

    MaxResults: 1,
  });

  const response = await pricingClient.send(command);

  return response;
};

const getRDSPricing = async (pricingClient, pricingFilters) => {
  const command = new GetProductsCommand({
    ServiceCode: "AmazonRDS",

    Filters: [
      {
        Type: "TERM_MATCH",
        Field: "instanceType",
        Value: pricingFilters.instanceType,
      },
      {
        Type: "TERM_MATCH",
        Field: "location",
        Value: pricingFilters.location,
      },
      {
        Type: "TERM_MATCH",
        Field: "databaseEngine",
        Value: pricingFilters.databaseEngine,
      },
      {
        Type: "TERM_MATCH",
        Field: "deploymentOption",
        Value: pricingFilters.deploymentOption,
      },
    ],

    MaxResults: 1,
  });

  const response = await pricingClient.send(command);

  return response;
};

module.exports = {
  getEC2Pricing,
  getS3Pricing,
  getRDSPricing,
};