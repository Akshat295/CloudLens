import { motion } from "framer-motion";

// Shared "glass" card shell (blurred white surface, soft border/shadow) used
// by every card-like block in the app — chart cards, summary cards, table
// containers, stat tiles. Centralizing it here means the look only has to be
// tuned in one place, and any motion props (variants, whileHover, ...) just
// pass through to the underlying motion.div.
const Card = ({ children, className = "", padding = "p-6", hover = false, ...motionProps }) => (
  <motion.div
    className={`rounded-2xl border border-white/60 bg-white/70 ${padding} shadow-md shadow-slate-200/50 backdrop-blur-xl ${
      hover ? "transition-shadow duration-300 hover:shadow-xl hover:shadow-slate-300/50" : ""
    } ${className}`}
    {...motionProps}
  >
    {children}
  </motion.div>
);

export default Card;
