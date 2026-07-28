// Generic ascending comparator for table sorting: numeric fields compare
// numerically, everything else falls back to locale-aware string comparison.
export const compareValues = (valueA, valueB) => {
  if (typeof valueA === "number" && typeof valueB === "number") {
    return valueA - valueB;
  }

  return String(valueA).localeCompare(String(valueB));
};
