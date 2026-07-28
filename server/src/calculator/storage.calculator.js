// AWS's well-known S3 Standard storage rate (first 50 TB/month tier,
// us-east-1) — used as a fallback whenever the live Pricing API can't
// resolve a rate for the bucket's region (unmapped region, missing
// pricing:GetProducts permission, or a filter mismatch), so a bucket still
// gets a meaningful cost estimate instead of silently reporting $0.
const S3_STANDARD_FALLBACK_PRICE_PER_GB = 0.023;

// S3 storage billing denominates "GB" as 2^30 bytes (GiB), not the decimal
// 10^9-byte GB — matching how AWS's own cost calculators convert
// BucketSizeBytes into billed storage.
const BYTES_PER_GB = 1024 ** 3;

const calculateBucketSizeGB = (bucketSizeBytes) => {
  return Number((bucketSizeBytes / BYTES_PER_GB).toFixed(2));
};

const calculateS3MonthlyCost = (bucketSizeGB, pricePerGB) => {
  const rate = pricePerGB > 0 ? pricePerGB : S3_STANDARD_FALLBACK_PRICE_PER_GB;

  return Number((bucketSizeGB * rate).toFixed(2));
};

const calculateS3EstimatedSavings = (monthlyCost, savingsRate) => {
  return Number((monthlyCost * savingsRate).toFixed(2));
};

module.exports = {
  calculateBucketSizeGB,
  calculateS3MonthlyCost,
  calculateS3EstimatedSavings,
};
