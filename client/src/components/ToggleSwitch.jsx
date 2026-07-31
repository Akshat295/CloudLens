import { motion } from "framer-motion";

// Track is h-6 w-11 (24x44), knob is h-5 w-5 (20px) inset 2px (left-0.5/
// top-0.5) on every side — off sits at x:0 (2px left gap), on sits at x:20
// (2px right gap, since 2 + 20 + 20 = 42, leaving 44-42=2). Keeping the inset
// identical on both ends is what makes the knob look centered in either
// state instead of the track looking oversized.
const ToggleSwitch = ({ checked, onChange, disabled, label }) => (
  <motion.button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={label}
    onClick={onChange}
    disabled={disabled}
    className={`relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 ${
      checked ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-600"
    }`}
  >
    <motion.span
      animate={{ x: checked ? 20 : 0 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-md"
    />
  </motion.button>
);

export default ToggleSwitch;
