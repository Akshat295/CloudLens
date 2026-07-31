import { motion } from "framer-motion";
import { FaSpinner } from "react-icons/fa6";

const ACTION_VARIANTS = {
  danger: "bg-red-600 hover:bg-red-700 focus-visible:ring-red-300",
  warning: "bg-amber-500 hover:bg-amber-600 focus-visible:ring-amber-300",
  success: "bg-emerald-600 hover:bg-emerald-700 focus-visible:ring-emerald-300",
  primary: "bg-blue-600 hover:bg-blue-700 focus-visible:ring-blue-300",
};

// Shared pill-shaped action button (icon + label, spinner while loading)
// used by both RecommendationTable's row actions and the drawer's footer.
const ActionButton = ({ variant, icon: Icon, label, loadingLabel, loading, onClick }) => (
  <motion.button
    type="button"
    onClick={onClick}
    disabled={loading}
    whileHover={loading ? undefined : { scale: 1.04 }}
    whileTap={loading ? undefined : { scale: 0.96 }}
    className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition focus-visible:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-60 ${ACTION_VARIANTS[variant]}`}
  >
    {loading ? <FaSpinner className="animate-spin" size={12} /> : <Icon size={12} />}
    {loading ? loadingLabel : label}
  </motion.button>
);

export default ActionButton;
