import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FaMagnifyingGlass } from "react-icons/fa6";
import Navbar from "../components/Navbar";
import PageTransition from "../components/PageTransition";
import Card from "../components/Card";
import ErrorBanner from "../components/ErrorBanner";
import TableSkeleton from "../components/TableSkeleton";
import Badge from "../components/Badge";
import FilterSelect from "../components/FilterSelect";
import NoResultsState from "../components/NoResultsState";
import TablePagination from "../components/TablePagination";
import { getAuditLogs } from "../services/auditLog.service";
import { useAsyncData } from "../hooks/useAsyncData";
import { useScanTrigger } from "../hooks/useScanTrigger";
import { formatDateTime, formatAuditActionLabel } from "../utils/format";
import { getAuditActionBadgeStyle } from "../utils/badge";

const PAGE_SIZE = 10;

const ACTION_OPTIONS = [
  { value: "ALL", label: "All Actions" },
  { value: "USER_LOGIN", label: "User Login" },
  { value: "AWS_CONNECTED", label: "AWS Connected" },
  { value: "AWS_DISCONNECTED", label: "AWS Disconnected" },
  { value: "SCAN_STARTED", label: "Scan Started" },
  { value: "SCAN_COMPLETED", label: "Scan Completed" },
  { value: "RECOMMENDATION_IGNORED", label: "Recommendation Ignored" },
  { value: "RECOMMENDATION_RESOLVED", label: "Recommendation Resolved" },
  { value: "EC2_STOPPED", label: "EC2 Stopped" },
];

const COLUMNS = ["Timestamp", "Action", "Description"];

const containerVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { delay: 0.15, duration: 0.4, ease: "easeOut" } },
};

const rowVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: (index) => ({
    opacity: 1,
    y: 0,
    transition: { delay: Math.min(index, 8) * 0.03, duration: 0.25, ease: "easeOut" },
  }),
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

const matchesSearch = (log, query) => {
  if (!query) return true;

  const haystack = `${log.description} ${formatAuditActionLabel(log.action)}`.toLowerCase();
  return haystack.includes(query.toLowerCase());
};

const AuditLogs = () => {
  const { data: logs, loading, error, refetch } = useAsyncData(getAuditLogs, [], {
    initialValue: [],
    errorMessage: "Failed to load audit logs.",
  });

  const { scanning, scanError, runScan, stepIndex, scanPhase } = useScanTrigger(refetch);

  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);

  const filtered = useMemo(() => {
    return logs.filter((log) => {
      if (actionFilter !== "ALL" && log.action !== actionFilter) return false;
      if (!matchesSearch(log, search)) return false;
      return true;
    });
  }, [logs, actionFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const clearFilters = () => {
    setSearch("");
    setActionFilter("ALL");
    setCurrentPage(1);
  };

  return (
    <PageTransition className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 p-4 dark:from-slate-950 dark:to-slate-900 sm:p-6 lg:p-8">
      <Navbar onScan={runScan} scanning={scanning} stepIndex={stepIndex} scanPhase={scanPhase} />

      <div className="mt-6">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Audit Logs</h2>
        <p className="mt-1 text-slate-500 dark:text-slate-400">
          A record of important actions taken on your account.
        </p>
      </div>

      <ErrorBanner message={error || scanError} className="mt-6" />

      <Card className="mt-8" initial="hidden" animate="visible" variants={containerVariants}>
        {loading ? (
          <TableSkeleton columns={COLUMNS} />
        ) : !logs.length ? (
          <p className="text-slate-500">No activity has been recorded yet.</p>
        ) : (
          <>
            <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="relative w-full lg:max-w-xs">
                <FaMagnifyingGlass
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  size={13}
                />
                <input
                  type="text"
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Search by description or action..."
                  aria-label="Search audit logs"
                  className="w-full rounded-xl border border-slate-200 bg-white/80 py-2.5 pl-9 pr-3 text-sm text-slate-700 placeholder:text-slate-400 transition focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <FilterSelect
                label="Action"
                value={actionFilter}
                onChange={(value) => {
                  setActionFilter(value);
                  setCurrentPage(1);
                }}
                options={ACTION_OPTIONS}
              />
            </div>

            {filtered.length === 0 ? (
              <NoResultsState message="No audit logs match your filters." onClear={clearFilters} />
            ) : (
              <>
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full min-w-[640px] border-collapse text-sm" aria-label="Audit logs">
                    <thead className="bg-slate-50/95">
                      <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        {COLUMNS.map((label) => (
                          <th key={label} className="px-4 py-3">
                            {label}
                          </th>
                        ))}
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                      <AnimatePresence initial={false}>
                        {paginated.map((log, index) => (
                          <motion.tr
                            key={log._id}
                            custom={index}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            variants={rowVariants}
                            className="bg-white"
                          >
                            <td className="whitespace-nowrap px-4 py-3.5 font-medium text-slate-900">
                              {formatDateTime(log.createdAt)}
                            </td>

                            <td className="px-4 py-3.5">
                              <Badge {...getAuditActionBadgeStyle(log.action)}>
                                {formatAuditActionLabel(log.action)}
                              </Badge>
                            </td>

                            <td className="px-4 py-3.5 text-slate-600">{log.description}</td>
                          </motion.tr>
                        ))}
                      </AnimatePresence>
                    </tbody>
                  </table>
                </div>

                <TablePagination
                  page={safePage}
                  totalPages={totalPages}
                  pageSize={PAGE_SIZE}
                  totalItems={filtered.length}
                  onPageChange={setCurrentPage}
                />
              </>
            )}
          </>
        )}
      </Card>
    </PageTransition>
  );
};

export default AuditLogs;
