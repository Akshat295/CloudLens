import { motion } from "framer-motion";

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.2, ease: "easeIn" } },
};

// Wraps a page's root element so route changes (driven by AnimatePresence in
// App.jsx, keyed on location.pathname) get a subtle fade+rise instead of an
// abrupt swap.
const PageTransition = ({ children, className }) => (
  <motion.div
    initial="initial"
    animate="animate"
    exit="exit"
    variants={pageVariants}
    className={className}
  >
    {children}
  </motion.div>
);

export default PageTransition;
