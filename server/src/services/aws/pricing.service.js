const {
  GetProductsCommand,
} = require("@aws-sdk/client-pricing");

const {
  pricingClient,
} = require("../../config/aws");

const getEC2Pricing = async (pricingFilters) => {
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

module.exports = {
  getEC2Pricing,
};