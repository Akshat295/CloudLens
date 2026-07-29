import { motion } from "framer-motion";
import Skeleton from "react-loading-skeleton";
import {
  FaWandMagicSparkles,
  FaCircleInfo,
  FaTriangleExclamation,
  FaCircleExclamation,
  FaCircleCheck,
} from "react-icons/fa6";
import Card from "./Card";

const SEVERITY_META = {
  HIGH: { icon: FaTriangleExclamation, className: "text-red-500" },
  MEDIUM: { icon: FaCircleExclamation, className: "text-amber-500" },
  LOW: { icon: FaCircleCheck, className: "text-emerald-500" },
  INFO: { icon: FaCircleInfo, className: "text-blue-500" },
};

const listVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, x: -8 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.3, ease: "easeOut" } },
};

const SKELETON_ROW_WIDTHS = [95, 85, 90, 70];

// Rule-based (no LLM) insights generated server-side after each S3 scan —
// see server/src/services/insight/s3.insight.js. This card just renders
// whatever short sentences it's given, grouped visually by severity via an
// icon/color, matching the same SEVERITY_COLORS-driven language the rest of
// the dashboard already uses for HIGH/MEDIUM/LOW.
const AIInsightsCard = ({ insights = [], loading = false }) => {
  return (
    <Card
      hover
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, scale: 1.005 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="relative overflow-hidden"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-gradient-to-br from-indigo-400 to-blue-400 opacity-20 blur-3xl"
      />

      <div className="relative mb-5 flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-blue-500 text-white shadow-lg shadow-indigo-500/30">
          <FaWandMagicSparkles size={16} />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-slate-900">AI Insights</h2>
          <p className="text-sm text-slate-500">Rule-based analysis of your latest scan</p>
        </div>
      </div>

      {loading ? (
        <div className="relative space-y-3">
          {SKELETON_ROW_WIDTHS.map((width, index) => (
            <Skeleton key={index} height={16} width={`${width}%`} />
          ))}
        </div>
      ) : !insights.length ? (
        <p className="relative text-sm text-slate-400">
          No insights yet — run a scan to generate them.
        </p>
      ) : (
        <motion.ul initial="hidden" animate="visible" variants={listVariants} className="relative space-y-3">
          {insights.map((insight, index) => {
            const meta = SEVERITY_META[insight.severity] || SEVERITY_META.INFO;
            const Icon = meta.icon;

            return (
              <motion.li
                key={insight._id || index}
                variants={itemVariants}
                className="flex items-start gap-2.5 text-sm text-slate-700"
              >
                <Icon className={`mt-0.5 shrink-0 ${meta.className}`} size={14} />
                <span>{insight.message}</span>
              </motion.li>
            );
          })}
        </motion.ul>
      )}
    </Card>
  );
};

export default AIInsightsCard;
