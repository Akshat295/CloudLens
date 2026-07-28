// Soft pill badge with a leading color dot, driven by the style objects
// from utils/badge.js (e.g. getSeverityBadgeStyle, getRecommendationStatusBadgeStyle).
const Badge = ({ children, badgeClass = "", dotClass = "" }) => (
  <span
    className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${badgeClass}`}
  >
    <span className={`h-1.5 w-1.5 rounded-full ${dotClass}`} />
    {children}
  </span>
);

export default Badge;
