import { motion } from "framer-motion";

// Small pill link that opens an external URL (AWS Console, etc.) in a new
// tab — same visual weight as CopyButton so the two read as one action row.
const LinkButton = ({ href, icon: Icon, label }) => (
  <motion.a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    whileHover={{ scale: 1.03 }}
    whileTap={{ scale: 0.97 }}
    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-200"
  >
    <Icon size={12} />
    {label}
  </motion.a>
);

export default LinkButton;
