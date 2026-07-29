import { useState } from "react";
import { motion } from "framer-motion";
import { FaRegCopy, FaCheck } from "react-icons/fa6";

// Small pill button that copies `value` to the clipboard and flashes a
// "Copied" state briefly — used by the resource drawer's console actions.
const CopyButton = ({ value, label }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard API unavailable or permission denied — nothing to recover into.
    }
  };

  return (
    <motion.button
      type="button"
      onClick={handleCopy}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-200"
    >
      {copied ? (
        <FaCheck size={12} className="text-emerald-500" />
      ) : (
        <FaRegCopy size={12} />
      )}
      {copied ? "Copied" : label}
    </motion.button>
  );
};

export default CopyButton;
