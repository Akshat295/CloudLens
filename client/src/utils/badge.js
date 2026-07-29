// Tailwind color classes for the various status/severity badges used across
// the dashboard. Each domain (scan, recommendation, severity, resource state)
// has its own value set, so they are kept as separate lookups rather than one
// shared map. Success/warning/neutral consistently use emerald/amber/slate
// (matching the "richer" *BadgeStyle variants below) rather than mixing in
// green/yellow/gray for the same meaning.

export const getScanStatusBadgeClass = (status) => {
  switch (status) {
    case "COMPLETED":
      return "bg-emerald-100 text-emerald-700";
    case "RUNNING":
      return "bg-blue-100 text-blue-700";
    case "FAILED":
      return "bg-red-100 text-red-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
};

export const getRecommendationStatusBadgeClass = (status) => {
  switch (status) {
    case "OPEN":
      return "bg-blue-100 text-blue-700";
    case "IGNORED":
      return "bg-amber-100 text-amber-700";
    default:
      return "bg-emerald-100 text-emerald-700";
  }
};

export const getSeverityBadgeClass = (severity) => {
  switch (severity) {
    case "HIGH":
      return "bg-red-100 text-red-600";
    case "MEDIUM":
      return "bg-amber-100 text-amber-700";
    default:
      return "bg-emerald-100 text-emerald-600";
  }
};

export const getResourceStateBadgeClass = (state) => {
  switch (state?.toLowerCase()) {
    case "running":
      return "bg-emerald-100 text-emerald-700";
    case "stopped":
      return "bg-red-100 text-red-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
};

// Richer variants (soft fill + border + dot color) for the redesigned
// RecommendationTable's <Badge>, kept separate from the flat classes above
// so existing callers of the functions above are unaffected.
export const getSeverityBadgeStyle = (severity) => {
  switch (severity) {
    case "HIGH":
      return { badgeClass: "bg-red-50 text-red-700 border-red-200", dotClass: "bg-red-500" };
    case "MEDIUM":
      return { badgeClass: "bg-amber-50 text-amber-700 border-amber-200", dotClass: "bg-amber-500" };
    default:
      return { badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200", dotClass: "bg-emerald-500" };
  }
};

export const getRecommendationStatusBadgeStyle = (status) => {
  switch (status) {
    case "OPEN":
      return { badgeClass: "bg-blue-50 text-blue-700 border-blue-200", dotClass: "bg-blue-500" };
    case "IGNORED":
      return { badgeClass: "bg-amber-50 text-amber-700 border-amber-200", dotClass: "bg-amber-500" };
    default:
      return { badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200", dotClass: "bg-emerald-500" };
  }
};

export const getCategoryBadgeStyle = (category) => {
  switch (category) {
    case "SECURITY":
      return { badgeClass: "bg-red-50 text-red-700 border-red-200", dotClass: "bg-red-500" };
    case "PERFORMANCE":
      return { badgeClass: "bg-indigo-50 text-indigo-700 border-indigo-200", dotClass: "bg-indigo-500" };
    case "RELIABILITY":
      return { badgeClass: "bg-teal-50 text-teal-700 border-teal-200", dotClass: "bg-teal-500" };
    case "OPERATIONAL_EXCELLENCE":
      return { badgeClass: "bg-purple-50 text-purple-700 border-purple-200", dotClass: "bg-purple-500" };
    case "COST":
    default:
      return { badgeClass: "bg-amber-50 text-amber-700 border-amber-200", dotClass: "bg-amber-500" };
  }
};

export const getScanStatusBadgeStyle = (status) => {
  switch (status) {
    case "COMPLETED":
      return { badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200", dotClass: "bg-emerald-500" };
    case "RUNNING":
      return { badgeClass: "bg-blue-50 text-blue-700 border-blue-200", dotClass: "bg-blue-500" };
    case "FAILED":
      return { badgeClass: "bg-red-50 text-red-700 border-red-200", dotClass: "bg-red-500" };
    default:
      return { badgeClass: "bg-slate-50 text-slate-700 border-slate-200", dotClass: "bg-slate-400" };
  }
};
