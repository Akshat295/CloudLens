// Hex equivalents of the Tailwind gradient stops used elsewhere in the
// dashboard (SummaryCard, HeroSection), kept in one place so every chart
// draws from the same palette. Recharts needs real color values (SVG
// fill/stroke), not Tailwind class names.
export const CHART_COLORS = {
  blue: "#3b82f6",
  indigo: "#6366f1",
  emerald: "#10b981",
  green: "#22c55e",
  amber: "#f59e0b",
  orange: "#f97316",
  rose: "#f43f5e",
  red: "#ef4444",
  teal: "#14b8a6",
  slate: "#64748b",
};

export const SEVERITY_COLORS = {
  HIGH: CHART_COLORS.red,
  MEDIUM: CHART_COLORS.amber,
  LOW: CHART_COLORS.emerald,
};

export const RESOURCE_STATE_COLORS = {
  running: CHART_COLORS.emerald,
  stopped: CHART_COLORS.rose,
};

// 5-tier resource-health palette (Dashboard's ResourceHealthPieChart) — one
// step darker than CHART_COLORS.red for "critical" so it reads as more
// severe than plain "high" at a glance.
export const RESOURCE_HEALTH_COLORS = {
  CRITICAL: "#991b1b",
  HIGH: CHART_COLORS.red,
  MEDIUM: CHART_COLORS.amber,
  LOW: CHART_COLORS.blue,
  HEALTHY: CHART_COLORS.emerald,
};

export const CATEGORICAL_PALETTE = [
  CHART_COLORS.blue,
  CHART_COLORS.emerald,
  CHART_COLORS.amber,
  CHART_COLORS.rose,
  CHART_COLORS.indigo,
  CHART_COLORS.teal,
  CHART_COLORS.orange,
  CHART_COLORS.slate,
];
