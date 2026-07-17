const extractHourlyPrice = (pricingResponse) => {
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

module.exports = {
  extractHourlyPrice,
};