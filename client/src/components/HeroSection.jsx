import { motion } from "framer-motion";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import AnimatedCounter from "./AnimatedCounter";
import { formatCurrency, formatScanTime } from "../utils/format";

const StatBlock = ({ label, children }) => (
  <div className="flex flex-col gap-1">
    <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
      {label}
    </span>
    <span className="text-xl font-semibold text-white sm:text-2xl">
      {children}
    </span>
  </div>
);

// The "Run Scan" action now lives in the global Navbar (reachable from every
// page), so this section is presentational only: title, subtitle, and stats.
const HeroSection = ({
  totalResources,
  monthlyCost,
  estimatedSavings,
  lastScan,
  loading = false,
}) => {
  return (
    <motion.section
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-6 shadow-2xl shadow-indigo-950/40 sm:p-10"
    >
      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-indigo-500/20 blur-3xl" />

      <div className="relative">
        <h1 className="bg-gradient-to-r from-white via-blue-100 to-indigo-200 bg-clip-text text-4xl font-extrabold tracking-tight text-transparent sm:text-5xl">
          CloudLens
        </h1>
        <p className="mt-2 text-sm font-medium uppercase tracking-[0.2em] text-blue-300/80 sm:text-base">
          AI Infrastructure Optimizer
        </p>

        <SkeletonTheme baseColor="rgba(255,255,255,0.12)" highlightColor="rgba(255,255,255,0.28)">
          <div className="mt-8 flex flex-wrap gap-x-10 gap-y-6">
            <StatBlock label="Last Scan">
              {loading ? (
                <Skeleton width={130} height={22} />
              ) : lastScan ? (
                formatScanTime(lastScan)
              ) : (
                "No scans yet"
              )}
            </StatBlock>

            <StatBlock label="Total Resources">
              {loading ? (
                <Skeleton width={40} height={22} />
              ) : (
                <AnimatedCounter value={totalResources || 0} />
              )}
            </StatBlock>

            <StatBlock label="Monthly Cost">
              {loading ? (
                <Skeleton width={70} height={22} />
              ) : (
                <AnimatedCounter value={monthlyCost || 0} format={formatCurrency} />
              )}
            </StatBlock>

            <StatBlock label="Estimated Savings">
              {loading ? (
                <Skeleton width={70} height={22} />
              ) : (
                <AnimatedCounter value={estimatedSavings || 0} format={formatCurrency} />
              )}
            </StatBlock>
          </div>
        </SkeletonTheme>
      </div>
    </motion.section>
  );
};

export default HeroSection;
