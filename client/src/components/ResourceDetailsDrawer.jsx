import { useEffect } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { FaXmark, FaCircleStop, FaBan, FaCircleCheck } from "react-icons/fa6";
import ActionButton from "./ActionButton";
import Badge from "./Badge";
import ResourceDetailsDrawerSkeleton from "./ResourceDetailsDrawerSkeleton";
import { formatDateTime, formatCurrency } from "../utils/format";
import {
  getResourceStateBadgeClass,
  getSeverityBadgeStyle,
  getRecommendationStatusBadgeStyle,
} from "../utils/badge";

const formatState = (state) => {
  if (!state) return "N/A";
  return state.charAt(0).toUpperCase() + state.slice(1);
};

const DetailRow = ({ label, value, children }) => (
  <div className="flex items-start justify-between gap-4 py-2.5">
    <dt className="shrink-0 text-sm text-slate-500">{label}</dt>
    <dd className="break-all text-right text-sm font-medium text-slate-900">
      {children ?? value ?? "N/A"}
    </dd>
  </div>
);

const StatTile = ({ label, value, accentClass }) => (
  <motion.div
    whileHover={{ y: -2, scale: 1.03 }}
    transition={{ type: "spring", stiffness: 320, damping: 22 }}
    className="rounded-xl border border-slate-100 bg-slate-50/80 p-3 text-center"
  >
    <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{label}</p>
    <p className={`mt-1 text-lg font-bold ${accentClass}`}>{value}</p>
  </motion.div>
);

const bodyContainerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
};

const bodyItemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
};

const ResourceDetailsDrawer = ({
  resource,
  onClose,
  onIgnore,
  onResolve,
  onStop,
  actionLoadingId,
  stoppingId,
  loading = false,
}) => {
  useEffect(() => {
    if (!resource) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [resource, onClose]);

  // Portalled to document.body: this drawer's parent (RecommendationTable's
  // card wrapper) has backdrop-blur-xl, and `backdrop-filter` on an ancestor
  // creates a new containing block for `position: fixed` descendants —
  // without the portal this drawer was being confined/positioned relative to
  // that card instead of the viewport.
  return createPortal(
    <AnimatePresence>
      {resource && [
        <motion.div
          key="overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm"
          onClick={onClose}
          aria-hidden="true"
        />,

        <motion.aside
          key="drawer"
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", stiffness: 320, damping: 32 }}
          className="fixed right-0 top-0 z-50 flex h-full w-full max-w-lg flex-col border-l border-white/60 bg-white/95 shadow-2xl backdrop-blur-xl"
          role="dialog"
          aria-modal="true"
          aria-labelledby="resource-drawer-title"
        >
          {loading ? (
            <>
              <div className="flex items-center justify-end border-b border-slate-100 px-6 py-5">
                <motion.button
                  type="button"
                  onClick={onClose}
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  className="shrink-0 rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
                  aria-label="Close drawer"
                >
                  <FaXmark size={16} />
                </motion.button>
              </div>
              <ResourceDetailsDrawerSkeleton />
            </>
          ) : (
            <>
              <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wide text-blue-500">
                    {resource.resourceType || "Resource"} Details
                  </p>
                  <h2
                    id="resource-drawer-title"
                    className="mt-1 truncate text-lg font-bold text-slate-900"
                  >
                    {resource.resourceName || resource.resourceId}
                  </h2>
                  <p className="mt-0.5 truncate text-sm text-slate-400">{resource.resourceId}</p>
                </div>

                <motion.button
                  type="button"
                  onClick={onClose}
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  className="shrink-0 rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
                  aria-label="Close drawer"
                >
                  <FaXmark size={16} />
                </motion.button>
              </div>

              <motion.div
                initial="hidden"
                animate="visible"
                variants={bodyContainerVariants}
                className="flex-1 overflow-y-auto px-6 py-5"
              >
                <motion.div variants={bodyItemVariants} className="mb-5 flex flex-wrap items-center gap-2">
                  <Badge {...getRecommendationStatusBadgeStyle(resource.status)}>
                    {resource.status || "OPEN"}
                  </Badge>

                  {resource.severity && (
                    <Badge {...getSeverityBadgeStyle(resource.severity)}>
                      {resource.severity} severity
                    </Badge>
                  )}
                </motion.div>

                <motion.div variants={bodyItemVariants} className="mb-6 grid grid-cols-3 gap-2 sm:gap-3">
                  <StatTile
                    label="Est. Savings"
                    value={formatCurrency(resource.estimatedSavings)}
                    accentClass="text-emerald-600"
                  />
                  <StatTile
                    label="Monthly Cost"
                    value={formatCurrency(resource.monthlyCost)}
                    accentClass="text-amber-600"
                  />
                  <StatTile
                    label="Confidence"
                    value={`${resource.confidence ?? 0}%`}
                    accentClass="text-blue-600"
                  />
                </motion.div>

                <motion.div variants={bodyItemVariants} className="mb-6 rounded-xl border border-slate-100 bg-slate-50/60 p-4">
                  <h3 className="text-sm font-semibold text-slate-700">CPU Recommendation</h3>
                  <p className="mt-1 text-sm leading-relaxed text-slate-600">
                    {resource.recommendation || "N/A"}
                  </p>

                  <h3 className="mt-4 text-sm font-semibold text-slate-700">Reason</h3>
                  <p className="mt-1 text-sm leading-relaxed text-slate-600">
                    {resource.reason || "N/A"}
                  </p>
                </motion.div>

                <motion.div variants={bodyItemVariants} className="rounded-xl border border-slate-100 bg-slate-50/60 px-4">
                  <dl className="divide-y divide-slate-100">
                    <DetailRow label="Resource Type" value={resource.resourceType} />
                    {resource.instanceType && (
                      <DetailRow label="Instance Type" value={resource.instanceType} />
                    )}
                    <DetailRow label="Instance State">
                      <span
                        className={`inline-block rounded-full px-3 py-0.5 text-xs font-semibold ${getResourceStateBadgeClass(resource.state)}`}
                      >
                        {formatState(resource.state)}
                      </span>
                    </DetailRow>
                    <DetailRow label="Public IP" value={resource.publicIp || "N/A"} />
                    <DetailRow label="Private IP" value={resource.privateIp} />
                    <DetailRow label="Availability Zone" value={resource.availabilityZone} />
                    <DetailRow label="Launch Time" value={formatDateTime(resource.launchTime)} />
                  </dl>
                </motion.div>
              </motion.div>

              {resource.status === "OPEN" && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.3, ease: "easeOut" }}
                  className="flex flex-wrap items-center gap-2 border-t border-slate-100 px-6 py-4"
                >
                  {resource.action === "STOP" && (
                    <ActionButton
                      variant="danger"
                      icon={FaCircleStop}
                      label="Stop Instance"
                      loadingLabel="Stopping..."
                      loading={stoppingId === resource._id}
                      onClick={() => onStop(resource._id)}
                    />
                  )}

                  <ActionButton
                    variant="warning"
                    icon={FaBan}
                    label="Ignore"
                    loadingLabel="Ignoring..."
                    loading={actionLoadingId === resource._id}
                    onClick={() => onIgnore(resource._id)}
                  />

                  <ActionButton
                    variant="success"
                    icon={FaCircleCheck}
                    label="Resolve"
                    loadingLabel="Resolving..."
                    loading={actionLoadingId === resource._id}
                    onClick={() => onResolve(resource._id)}
                  />
                </motion.div>
              )}
            </>
          )}
        </motion.aside>,
      ]}
    </AnimatePresence>,
    document.body
  );
};

export default ResourceDetailsDrawer;
