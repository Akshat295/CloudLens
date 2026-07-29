// Generic EC2 size ladder ("family.size") used to estimate the next size up
// or down for cost-comparison purposes (Feature 8's UPSIZE/DOWNSIZE cost
// estimate). Family (t3, m5, c6g, ...) is kept as-is — only the size suffix
// is stepped, since that's what "upsize"/"downsize" means in practice.
const SIZE_LADDER = [
  "nano",
  "micro",
  "small",
  "medium",
  "large",
  "xlarge",
  "2xlarge",
  "4xlarge",
  "8xlarge",
  "9xlarge",
  "10xlarge",
  "12xlarge",
  "16xlarge",
  "18xlarge",
  "24xlarge",
  "32xlarge",
  "metal",
];

// Returns null when the instance type can't be parsed or is already at the
// top/bottom of the ladder — callers should fall back to "no change" rather
// than guessing.
const getAdjacentInstanceType = (instanceType, direction) => {
  const [family, size] = (instanceType || "").split(".");
  if (!family || !size) return null;

  const index = SIZE_LADDER.indexOf(size);
  if (index === -1) return null;

  const targetIndex = direction === "up" ? index + 1 : index - 1;
  if (targetIndex < 0 || targetIndex >= SIZE_LADDER.length) return null;

  return `${family}.${SIZE_LADDER[targetIndex]}`;
};

module.exports = {
  getAdjacentInstanceType,
};
