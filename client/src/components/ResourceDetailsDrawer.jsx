import { useEffect } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  FaXmark,
  FaCircleStop,
  FaBan,
  FaCircleCheck,
  FaArrowUpRightFromSquare,
  FaChartLine,
  FaLock,
} from "react-icons/fa6";
import ActionButton from "./ActionButton";
import Badge from "./Badge";
import CopyButton from "./CopyButton";
import LinkButton from "./LinkButton";
import ResourceDetailsDrawerSkeleton from "./ResourceDetailsDrawerSkeleton";
import { formatDateTime, formatCurrency, formatPercent, formatBytes, formatActionLabel } from "../utils/format";
import {
  getResourceStateBadgeClass,
  getSeverityBadgeStyle,
  getRecommendationStatusBadgeStyle,
  getCategoryBadgeStyle,
} from "../utils/badge";
import {
  getS3ConsoleUrl,
  getS3MetricsUrl,
  getS3PermissionsUrl,
  getS3BucketArn,
} from "../utils/awsConsole";

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

                  <Badge {...getCategoryBadgeStyle(resource.category)}>{resource.category || "COST"}</Badge>

                  {resource.action && resource.action !== "NONE" && (
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600">
                      {formatActionLabel(resource.action)}
                    </span>
                  )}
                </motion.div>

                {resource.resourceType === "EC2" && (
                  <motion.div
                    variants={bodyItemVariants}
                    className="mb-6 rounded-xl border border-slate-100 bg-slate-50/60 p-4"
                  >
                    <h3 className="mb-3 text-sm font-semibold text-slate-700">
                      Optimization Insights
                    </h3>

                    <dl className="divide-y divide-slate-100">
                      <DetailRow
                        label="Average CPU"
                        value={formatPercent(resource.metadata?.averageCpu)}
                      />
                      <DetailRow
                        label="Network In / Out"
                        value={`${formatBytes(resource.metadata?.networkIn)} / ${formatBytes(resource.metadata?.networkOut)}`}
                      />
                      <DetailRow
                        label="Disk Read / Write"
                        value={`${formatBytes(resource.metadata?.diskReadBytes)} / ${formatBytes(resource.metadata?.diskWriteBytes)}`}
                      />
                      <DetailRow
                        label="Disk Ops (Read / Write)"
                        value={`${Math.round(resource.metadata?.diskReadOps || 0)} / ${Math.round(resource.metadata?.diskWriteOps || 0)} ops/hr`}
                      />
                      <DetailRow
                        label="Launch Date"
                        value={formatDateTime(resource.metadata?.launchTime)}
                      />
                      <DetailRow
                        label="Instance Age"
                        value={`${resource.metadata?.instanceAgeDays ?? 0} days`}
                      />
                      <DetailRow label="Elastic IP" value={resource.metadata?.elasticIp || "NONE"} />

                      <DetailRow label="Security Groups">
                        <div className="flex flex-wrap justify-end gap-1">
                          {resource.metadata?.securityGroups?.length ? (
                            resource.metadata.securityGroups.map((group) => (
                              <span
                                key={group.groupId}
                                className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600"
                              >
                                {group.groupName || group.groupId}
                              </span>
                            ))
                          ) : (
                            <span>N/A</span>
                          )}
                        </div>
                      </DetailRow>

                      <DetailRow label="EBS Volumes">
                        <div className="flex flex-col items-end gap-1">
                          {resource.metadata?.volumeIds?.length ? (
                            resource.metadata.volumeIds.map((volumeId, index) => (
                              <span key={volumeId} className="text-xs text-slate-600">
                                {volumeId} · {resource.metadata.volumeTypes?.[index] || "—"} ·{" "}
                                {resource.metadata.encrypted?.[index] ? "Encrypted" : "Unencrypted"}
                              </span>
                            ))
                          ) : (
                            <span>N/A</span>
                          )}
                        </div>
                      </DetailRow>
                    </dl>

                    <div className="mt-4 grid grid-cols-3 gap-2 sm:gap-3">
                      <StatTile
                        label="Current Cost"
                        value={formatCurrency(resource.metadata?.costComparison?.currentMonthlyCost)}
                        accentClass="text-amber-600"
                      />
                      <StatTile
                        label="Optimized Cost"
                        value={formatCurrency(resource.metadata?.costComparison?.optimizedMonthlyCost)}
                        accentClass="text-blue-600"
                      />
                      <StatTile
                        label="Monthly Savings"
                        value={formatCurrency(resource.metadata?.costComparison?.monthlySavings)}
                        accentClass="text-emerald-600"
                      />
                    </div>
                  </motion.div>
                )}

                {resource.resourceType === "RDS" && (
                  <motion.div
                    variants={bodyItemVariants}
                    className="mb-6 rounded-xl border border-slate-100 bg-slate-50/60 p-4"
                  >
                    <h3 className="mb-3 text-sm font-semibold text-slate-700">
                      Database Details
                    </h3>

                    <div className="mb-4 grid grid-cols-2 gap-2 sm:gap-3">
                      <StatTile
                        label="Monthly Cost"
                        value={formatCurrency(resource.metadata?.monthlyCost)}
                        accentClass="text-amber-600"
                      />
                      <StatTile
                        label="Average CPU"
                        value={formatPercent(resource.metadata?.averageCpu)}
                        accentClass="text-blue-600"
                      />
                    </div>

                    <dl className="divide-y divide-slate-100">
                      <DetailRow
                        label="Engine"
                        value={`${resource.metadata?.engine || "N/A"} ${resource.metadata?.engineVersion || ""}`.trim()}
                      />
                      <DetailRow label="Instance Class" value={resource.metadata?.instanceClass} />
                      <DetailRow label="Status" value={resource.metadata?.status} />
                      <DetailRow label="Storage Type" value={resource.metadata?.storageType} />
                      <DetailRow
                        label="Allocated Storage"
                        value={`${resource.metadata?.allocatedStorage ?? 0} GB`}
                      />
                      <DetailRow label="Multi-AZ" value={resource.metadata?.multiAZ ? "Yes" : "No"} />
                      <DetailRow
                        label="Publicly Accessible"
                        value={resource.metadata?.publiclyAccessible ? "Yes" : "No"}
                      />
                      <DetailRow
                        label="Backup Retention"
                        value={`${resource.metadata?.backupRetentionPeriod ?? 0} day(s)`}
                      />
                      <DetailRow
                        label="Storage Encrypted"
                        value={resource.metadata?.storageEncrypted ? "Yes" : "No"}
                      />
                      <DetailRow label="Availability Zone" value={resource.metadata?.availabilityZone} />
                      <DetailRow
                        label="Endpoint"
                        value={
                          resource.metadata?.endpoint?.address
                            ? `${resource.metadata.endpoint.address}:${resource.metadata.endpoint.port}`
                            : "N/A"
                        }
                      />
                    </dl>
                  </motion.div>
                )}

                {(resource.resourceType === "IAM_USER" ||
                  resource.resourceType === "IAM_ROLE" ||
                  resource.resourceType === "IAM_ROOT_ACCOUNT") && (
                  <motion.div
                    variants={bodyItemVariants}
                    className="mb-6 rounded-xl border border-slate-100 bg-slate-50/60 p-4"
                  >
                    <h3 className="mb-3 text-sm font-semibold text-slate-700">
                      {resource.resourceType === "IAM_ROLE"
                        ? "Role Security"
                        : resource.resourceType === "IAM_ROOT_ACCOUNT"
                          ? "Root Account Security"
                          : "User Security"}
                    </h3>

                    <div className="mb-4 flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          resource.metadata?.mfaEnabled
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-red-50 text-red-700"
                        }`}
                      >
                        MFA {resource.metadata?.mfaEnabled ? "Enabled" : "Disabled"}
                      </span>

                      {resource.metadata?.hasAdminAccess && (
                        <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">
                          Administrator Access
                        </span>
                      )}
                    </div>

                    {resource.resourceType !== "IAM_ROOT_ACCOUNT" && (
                      <dl className="divide-y divide-slate-100">
                        {resource.resourceType === "IAM_USER" && (
                          <>
                            <DetailRow
                              label="Last Login"
                              value={formatDateTime(resource.metadata?.passwordLastUsed)}
                            />

                            <DetailRow label="Groups">
                              <div className="flex flex-wrap justify-end gap-1">
                                {resource.metadata?.groups?.length ? (
                                  resource.metadata.groups.map((group) => (
                                    <span
                                      key={group}
                                      className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600"
                                    >
                                      {group}
                                    </span>
                                  ))
                                ) : (
                                  <span>N/A</span>
                                )}
                              </div>
                            </DetailRow>

                            <DetailRow label="Access Keys">
                              <div className="flex flex-col items-end gap-1">
                                {resource.metadata?.accessKeys?.length ? (
                                  resource.metadata.accessKeys.map((key) => (
                                    <span key={key.accessKeyId} className="text-xs text-slate-600">
                                      {key.accessKeyId} · {key.status} · {key.ageDays ?? 0}d old
                                      {key.isOld ? " (rotate)" : ""}
                                    </span>
                                  ))
                                ) : (
                                  <span>N/A</span>
                                )}
                              </div>
                            </DetailRow>
                          </>
                        )}

                        {resource.resourceType === "IAM_ROLE" && (
                          <>
                            <DetailRow
                              label="Last Used"
                              value={formatDateTime(resource.metadata?.lastUsedDate)}
                            />

                            <DetailRow label="Trust Policy (Trusted Services)">
                              <div className="flex flex-wrap justify-end gap-1">
                                {resource.metadata?.trustedServices?.length ? (
                                  resource.metadata.trustedServices.map((service) => (
                                    <span
                                      key={service}
                                      className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600"
                                    >
                                      {service}
                                    </span>
                                  ))
                                ) : (
                                  <span>N/A</span>
                                )}
                              </div>
                            </DetailRow>
                          </>
                        )}

                        <DetailRow label="Attached Policies">
                          <div className="flex flex-wrap justify-end gap-1">
                            {resource.metadata?.attachedPolicies?.length ? (
                              resource.metadata.attachedPolicies.map((policy) => (
                                <span
                                  key={policy.policyArn || policy.policyName}
                                  className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600"
                                >
                                  {policy.policyName}
                                </span>
                              ))
                            ) : (
                              <span>N/A</span>
                            )}
                          </div>
                        </DetailRow>

                        <DetailRow label="Inline Policies">
                          <div className="flex flex-wrap justify-end gap-1">
                            {resource.metadata?.inlinePolicies?.length ? (
                              resource.metadata.inlinePolicies.map((policyName) => (
                                <span
                                  key={policyName}
                                  className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600"
                                >
                                  {policyName}
                                </span>
                              ))
                            ) : (
                              <span>N/A</span>
                            )}
                          </div>
                        </DetailRow>
                      </dl>
                    )}
                  </motion.div>
                )}

                {resource.resourceType === "S3" && (
                  <motion.div
                    variants={bodyItemVariants}
                    className="mb-6 rounded-xl border border-slate-100 bg-slate-50/60 p-4"
                  >
                    <h3 className="mb-3 text-sm font-semibold text-slate-700">
                      AWS Console Actions
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      <LinkButton
                        href={getS3ConsoleUrl(resource.resourceId, resource.metadata?.region)}
                        icon={FaArrowUpRightFromSquare}
                        label="Open in AWS Console"
                      />
                      <LinkButton
                        href={getS3MetricsUrl(resource.resourceId, resource.metadata?.region)}
                        icon={FaChartLine}
                        label="Open Metrics"
                      />
                      <LinkButton
                        href={getS3PermissionsUrl(resource.resourceId, resource.metadata?.region)}
                        icon={FaLock}
                        label="Open Permissions"
                      />
                      <CopyButton value={getS3BucketArn(resource.resourceId)} label="Copy ARN" />
                      <CopyButton value={resource.resourceId} label="Copy Bucket Name" />
                    </div>
                  </motion.div>
                )}

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
                  <h3 className="text-sm font-semibold text-slate-700">
                    {resource.resourceType === "EC2" ? "CPU Recommendation" : "Recommendation"}
                  </h3>
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
                  {resource.action === "STOP" &&
                    (resource.state?.toLowerCase() === "stopped" ? (
                      <span className="text-xs text-slate-400">Instance already stopped</span>
                    ) : (
                      <ActionButton
                        variant="danger"
                        icon={FaCircleStop}
                        label="Stop Instance"
                        loadingLabel="Stopping..."
                        loading={stoppingId === resource._id}
                        onClick={() => onStop(resource._id)}
                      />
                    ))}

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
