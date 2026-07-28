import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { FaMagnifyingGlass, FaEye } from "react-icons/fa6";
import Navbar from "../components/Navbar";
import PageTransition from "../components/PageTransition";
import Card from "../components/Card";
import ErrorBanner from "../components/ErrorBanner";
import TableSkeleton from "../components/TableSkeleton";
import Badge from "../components/Badge";
import FilterSelect from "../components/FilterSelect";
import NoResultsState from "../components/NoResultsState";
import SortableTh from "../components/SortableTh";
import TablePagination from "../components/TablePagination";
import { getScans } from "../services/scan.service";
import { useAsyncData } from "../hooks/useAsyncData";
import { useScanTrigger } from "../hooks/useScanTrigger";
import {
  formatScanTime,
  formatCurrency,
  formatScanDuration,
  getScanDurationMs,
} from "../utils/format";
import { getScanStatusBadgeStyle } from "../utils/badge";
import { compareValues } from "../utils/sort";

const PAGE_SIZE = 8;

const STATUS_OPTIONS = [
  { value: "ALL", label: "All Statuses" },
  { value: "COMPLETED", label: "Completed" },
  { value: "RUNNING", label: "Running" },
  { value: "FAILED", label: "Failed" },
];

const COLUMNS = [
  { key: "date", label: "Scan Date", sortKey: "date" },
  { key: "resources", label: "Resources", sortKey: "resources" },
  { key: "savings", label: "Savings", sortKey: "savings" },
  { key: "duration", label: "Duration", sortKey: "duration" },
  { key: "status", label: "Status", sortKey: "status" },
  { key: "actions", label: "View Details", sortKey: null },
];

const SKELETON_COLUMNS = COLUMNS.map((column) => column.label);

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

const getSortValue = (scan, key) => {
  switch (key) {
    case "date":
      return new Date(scan.completedAt || scan.startedAt || scan.createdAt).getTime() || 0;
    case "resources":
      return scan.totalResources || 0;
    case "savings":
      return scan.estimatedSavings || 0;
    case "duration":
      return getScanDurationMs(scan) ?? -1;
    case "status":
      return (scan.status || "").toLowerCase();
    default:
      return "";
  }
};

const matchesSearch = (scan, query) => {
  if (!query) return true;

  const haystack = `${formatScanTime(scan)} ${scan.status || ""} ${scan._id || ""}`.toLowerCase();
  return haystack.includes(query.toLowerCase());
};

const ScanHistory = () => {
  const navigate = useNavigate();

  const { data: scans, loading, error, refetch } = useAsyncData(getScans, [], {
    initialValue: [],
    errorMessage: "Failed to load scan history.",
  });

  const { scanning, scanError, runScan, stepIndex, scanPhase } = useScanTrigger(refetch);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sortConfig, setSortConfig] = useState({ key: "date", direction: "desc" });
  const [currentPage, setCurrentPage] = useState(1);

  const filteredAndSorted = useMemo(() => {
    let result = scans.filter((scan) => {
      if (statusFilter !== "ALL" && scan.status !== statusFilter) return false;
      if (!matchesSearch(scan, search)) return false;
      return true;
    });

    if (sortConfig) {
      result = [...result].sort((a, b) => {
        const comparison = compareValues(getSortValue(a, sortConfig.key), getSortValue(b, sortConfig.key));
        return sortConfig.direction === "asc" ? comparison : -comparison;
      });
    }

    return result;
  }, [scans, statusFilter, search, sortConfig]);

  const totalPages = Math.max(1, Math.ceil(filteredAndSorted.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const paginated = filteredAndSorted.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const handleSort = (sortKey) => {
    setSortConfig((prev) => {
      if (!prev || prev.key !== sortKey) return { key: sortKey, direction: "asc" };
      if (prev.direction === "asc") return { key: sortKey, direction: "desc" };
      return null;
    });
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("ALL");
    setCurrentPage(1);
  };

  const viewScan = (scanId) => navigate(`/scan-history/${scanId}`);

  return (
    <PageTransition className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 p-4 dark:from-slate-950 dark:to-slate-900 sm:p-6 lg:p-8">
      <Navbar onScan={runScan} scanning={scanning} stepIndex={stepIndex} scanPhase={scanPhase} />

      <div className="mt-6">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Scan History</h2>
        <p className="mt-1 text-slate-500 dark:text-slate-400">
          View past infrastructure scans and their results.
        </p>
      </div>

      <ErrorBanner message={error || scanError} className="mt-6" />

      <Card className="mt-8" initial="hidden" animate="visible" variants={containerVariants}>
        {loading ? (
          <TableSkeleton columns={SKELETON_COLUMNS} />
        ) : !scans.length ? (
          <>
            <p className="text-slate-500">
              No scans yet. Run a scan from the dashboard to get started.
            </p>
            <Link
              to="/"
              className="mt-4 inline-block text-blue-600 hover:underline"
            >
              Go to Dashboard
            </Link>
          </>
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
                  placeholder="Search by date or status..."
                  aria-label="Search scan history"
                  className="w-full rounded-xl border border-slate-200 bg-white/80 py-2.5 pl-9 pr-3 text-sm text-slate-700 placeholder:text-slate-400 transition focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <FilterSelect
                label="Status"
                value={statusFilter}
                onChange={(value) => {
                  setStatusFilter(value);
                  setCurrentPage(1);
                }}
                options={STATUS_OPTIONS}
              />
            </div>

            {filteredAndSorted.length === 0 ? (
              <NoResultsState message="No scans match your filters." onClear={clearFilters} />
            ) : (
              <>
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full min-w-[720px] border-collapse text-sm" aria-label="Scan history">
                    <thead className="bg-slate-50/95">
                      <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        {COLUMNS.map((column) => (
                          <SortableTh key={column.key} column={column} sortConfig={sortConfig} onSort={handleSort} />
                        ))}
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                      <AnimatePresence initial={false}>
                        {paginated.map((scan, index) => (
                          <motion.tr
                            key={scan._id}
                            custom={index}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            variants={rowVariants}
                            whileHover={{ backgroundColor: "rgba(239, 246, 255, 0.6)" }}
                            whileTap={{ scale: 0.997 }}
                            onClick={() => viewScan(scan._id)}
                            className="cursor-pointer bg-white"
                          >
                            <td className="px-4 py-3.5 font-medium text-slate-900">
                              {formatScanTime(scan)}
                            </td>

                            <td className="px-4 py-3.5 text-slate-600">
                              {scan.totalResources ?? 0}
                            </td>

                            <td className="px-4 py-3.5 font-medium text-slate-700">
                              {formatCurrency(scan.estimatedSavings)}
                            </td>

                            <td className="px-4 py-3.5 text-slate-600">
                              {formatScanDuration(scan)}
                            </td>

                            <td className="px-4 py-3.5">
                              <Badge {...getScanStatusBadgeStyle(scan.status)}>{scan.status}</Badge>
                            </td>

                            <td className="px-4 py-3.5" onClick={(event) => event.stopPropagation()}>
                              <motion.button
                                type="button"
                                onClick={() => viewScan(scan._id)}
                                whileHover={{ scale: 1.04 }}
                                whileTap={{ scale: 0.96 }}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-blue-600 transition hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
                              >
                                <FaEye size={12} /> View Details
                              </motion.button>
                            </td>
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
                  totalItems={filteredAndSorted.length}
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

export default ScanHistory;
