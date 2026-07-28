import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { FaCircleCheck, FaCircleExclamation, FaSpinner } from "react-icons/fa6";
import { SCAN_STEPS } from "../constants/scanSteps";

const StepRow = ({ label, state }) => (
  <div className="flex items-center gap-3 py-2">
    <span className="flex h-6 w-6 shrink-0 items-center justify-center">
      {state === "done" && <FaCircleCheck className="text-lg text-emerald-500" />}
      {state === "active" && <FaSpinner className="animate-spin text-lg text-blue-500" />}
      {state === "error" && <FaCircleExclamation className="text-lg text-red-500" />}
      {state === "pending" && (
        <span className="h-2 w-2 rounded-full bg-slate-300 dark:bg-slate-600" />
      )}
    </span>
    <span
      className={`text-sm font-medium transition-colors ${
        state === "pending"
          ? "text-slate-400 dark:text-slate-500"
          : "text-slate-800 dark:text-slate-100"
      }`}
    >
      {label}
    </span>
  </div>
);

const getStepState = (index, stepIndex, phase) => {
  if (phase === "error" && index === stepIndex) return "error";
  if (phase === "success" || index < stepIndex) return "done";
  if (index === stepIndex) return "active";
  return "pending";
};

const ScanProgressModal = ({ isOpen, stepIndex, phase }) => {
  const progressPercent =
    phase === "success"
      ? 100
      : ((stepIndex + (phase === "error" ? 0.5 : 1)) / SCAN_STEPS.length) * 100;

  // Portalled to document.body: Navbar (this component's logical parent) has
  // backdrop-blur-xl, and `backdrop-filter` on an ancestor creates a new
  // containing block for `position: fixed` descendants — without the portal
  // this modal was being positioned relative to the (short) navbar instead
  // of the viewport, pushing it mostly off-screen above the page.
  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="scan-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[60] bg-slate-900/50 backdrop-blur-sm"
            aria-hidden="true"
          />

          <motion.div
            key="scan-modal"
            initial={{ opacity: 0, y: 12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 340, damping: 30 }}
            className="fixed left-1/2 top-1/2 z-[70] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-white/60 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-slate-800"
            role="dialog"
            aria-modal="true"
            aria-label="Scan progress"
          >
            <div className="flex items-center gap-3">
              {phase === "error" ? (
                <FaCircleExclamation className="text-2xl text-red-500" />
              ) : phase === "success" ? (
                <FaCircleCheck className="text-2xl text-emerald-500" />
              ) : (
                <FaSpinner className="animate-spin text-2xl text-blue-500" />
              )}

              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {phase === "error"
                  ? "Scan Failed"
                  : phase === "success"
                    ? "Scan Complete"
                    : "Scanning Infrastructure..."}
              </h2>
            </div>

            <div className="mt-5 border-t border-slate-100 pt-3 dark:border-white/10">
              {SCAN_STEPS.map((step, index) => (
                <StepRow
                  key={step.key}
                  label={step.label}
                  state={getStepState(index, stepIndex, phase)}
                />
              ))}
            </div>

            <div
              role="progressbar"
              aria-label="Scan progress"
              aria-valuenow={Math.round(progressPercent)}
              aria-valuemin={0}
              aria-valuemax={100}
              className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-white/10"
            >
              <motion.div
                className={`h-full rounded-full ${
                  phase === "error"
                    ? "bg-red-500"
                    : "bg-gradient-to-r from-blue-500 to-indigo-500"
                }`}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default ScanProgressModal;
