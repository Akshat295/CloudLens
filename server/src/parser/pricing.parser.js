const extractHourlyPrice = (pricingResponse) => {
  if (!pricingResponse?.PriceList?.length) {
    return 0;
  }

  const product = JSON.parse(
    pricingResponse.PriceList[0]
  );

  const onDemand =
    Object.values(product.terms.OnDemand)[0];

  const priceDimension =
    Object.values(onDemand.priceDimensions)[0];

  return Number(
    priceDimension.pricePerUnit.USD
  );
};

// S3 storage pricing is tiered by usage volume (e.g. first 50 TB, next 450
// TB, over 500 TB), each exposed as its own priceDimension with a
// `beginRange`. The first tier ("0") is what a typical bucket falls into
// and is what the flat per-GB estimate in storage.calculator.js is for.
const extractStoragePricePerGB = (pricingResponse) => {
  if (!pricingResponse?.PriceList?.length) {
    return 0;
  }

  const product = JSON.parse(
    pricingResponse.PriceList[0]
  );

  const onDemand =
    Object.values(product.terms.OnDemand)[0];

  const priceDimensions =
    Object.values(onDemand.priceDimensions);

  const firstTier =
    priceDimensions.find((dimension) => dimension.beginRange === "0") ||
    priceDimensions[0];

  return Number(
    firstTier.pricePerUnit.USD
  );
};

module.exports = {
  extractHourlyPrice,
  extractStoragePricePerGB,
};