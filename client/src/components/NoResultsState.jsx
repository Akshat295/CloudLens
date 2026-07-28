import { motion } from "framer-motion";

// Shared "filters produced zero rows" state for tables (as opposed to the
// table having zero rows outright, which each table renders separately since
// the copy/CTA differs per domain).
const NoResultsState = ({ message, onClear }) => (
  <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
    <p className="text-sm text-slate-500">{message}</p>
    <motion.button
      type="button"
      onClick={onClear}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
    >
      Clear Filters
    </motion.button>
  </div>
);

export default NoResultsState;
