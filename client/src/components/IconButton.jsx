import { motion } from "framer-motion";

const iconButtonClass =
  "relative flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white";

// Shared square icon-only button (Navbar's theme toggle, notifications,
// avatar, mobile menu — previously four near-identical inline buttons).
const IconButton = ({ children, onClick, ariaLabel, className = "", ...rest }) => (
  <motion.button
    type="button"
    onClick={onClick}
    whileHover={{ scale: 1.08 }}
    whileTap={{ scale: 0.92 }}
    aria-label={ariaLabel}
    className={`${iconButtonClass} ${className}`}
    {...rest}
  >
    {children}
  </motion.button>
);

export default IconButton;
