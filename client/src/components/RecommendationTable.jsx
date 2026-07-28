import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  FaMagnifyingGlass,
  FaCircleStop,
  FaBan,
  FaCircleCheck,
} from "react-icons/fa6";
import Card from "./Card";
import ResourceDetailsDrawer from "./ResourceDetailsDrawer";
import RecommendationTableSkeleton from "./RecommendationTableSkeleton";
import Badge from "./Badge";
import ActionButton from "./ActionButton";
import FilterSelect from "./FilterSelect";
import NoResultsState from "./NoResultsState";
import SortableTh from "./SortableTh";
import TablePagination from "./TablePagination";
import { useRecommendationActions } from "../hooks/useRecommendationActions";
import { formatCurrency } from "../utils/format";
import { compareValues } from "../utils/sort";
import {
  getSeverityBadgeStyle,
  getRecommendationStatusBadgeStyle,
} from "../utils/badge";

const PAGE_SIZE = 8;

const SEVERITY_RANK = { HIGH: 3, MEDIUM: 2, LOW: 1 };

const SEVERITY_OPTIONS = [
  { value: "ALL", label: "All Severities" },
  { value: "HIGH", label: "High" },
  { value: "MEDIUM", label: "Medium" },
  { value: "LOW", label: "Low" },
];

const STATUS_OPTIONS = [
  { value: "ALL", label: "All Statuses" },
  { value: "OPEN", label: "Open" },
  { value: "RESOLVED", label: "Resolved" },
  { value: "IGNORED", label: "Ignored" },
];

const COLUMNS = [
  { key: "resource", label: "Resource", sortKey: "resourceName" },
  { key: "instanceType", label: "Instance Type", sortKey: "instanceType" },
  { key: "severity", label: "Severity", sortKey: "severity" },
  { key: "actions", label: "Actions", sortKey: null },
  { key: "savings", label: "Savings", sortKey: "estimatedSavings" },
  { key: "status", label: "Status", sortKey: "status" },
];

const containerVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { delay: 0.2, duration: 0.4, ease: "easeOut" } },
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

const getSortValue = (item, key) => {
  switch (key) {
    case "resourceName":
      return (item.resourceName || item.resourceId || "").toLowerCase();
    case "instanceType":
      return (item.instanceType || "").toLowerCase();
    case "severity":
      return SEVERITY_RANK[item.severity] || 0;
    case "estimatedSavings":
      return item.estimatedSavings || 0;
    case "status":
      return (item.status || "OPEN").toLowerCase();
    default:
      return "";
  }
};

const matchesSearch = (item, query) => {
  if (!query) return true;

  const haystack = `${item.resourceName || ""} ${item.resourceId || ""}`.toLowerCase();
  return haystack.includes(query.toLowerCase());
};

const RecommendationTable = ({
  recommendations = [],
  onRecommendationUpdate,
  refresh,
  loading = false,
}) => {
  const [selectedResource, setSelectedResource] = useState(null);

  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [resourceTypeFilter, setResourceTypeFilter] = useState("ALL");
  const [sortConfig, setSortConfig] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const resourceTypeOptions = useMemo(() => {
    const types = new Set(recommendations.map((item) => item.resourceType).filter(Boolean));
    return Array.from(types).sort();
  }, [recommendations]);

  const filteredAndSorted = useMemo(() => {
    let result = recommendations.filter((item) => {
      if (severityFilter !== "ALL" && item.severity !== severityFilter) return false;
      if (statusFilter !== "ALL" && (item.status || "OPEN") !== statusFilter) return false;
      if (resourceTypeFilter !== "ALL" && item.resourceType !== resourceTypeFilter) return false;
      if (!matchesSearch(item, search)) return false;
      return true;
    });

    if (sortConfig) {
      result = [...result].sort((a, b) => {
        const comparison = compareValues(getSortValue(a, sortConfig.key), getSortValue(b, sortConfig.key));
        return sortConfig.direction === "asc" ? comparison : -comparison;
      });
    }

    return result;
  }, [recommendations, severityFilter, statusFilter, resourceTypeFilter, search, sortConfig]);

  const totalPages = Math.max(1, Math.ceil(filteredAndSorted.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const paginated = filteredAndSorted.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  // Keeps the parent's recommendation list in sync AND, if the updated item
  // is the one currently open in the drawer, refreshes the drawer's copy too
  // (otherwise its Status/action buttons would stay stale after an action).
  const handleRecommendationUpdate = (updated) => {
    onRecommendationUpdate(updated);
    setSelectedResource((prev) => (prev && prev._id === updated._id ? updated : prev));
  };

  const { stoppingId, actionId, handleIgnore, handleResolve, handleStop } =
    useRecommendationActions(handleRecommendationUpdate, refresh);

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
    setSeverityFilter("ALL");
    setStatusFilter("ALL");
    setResourceTypeFilter("ALL");
    setCurrentPage(1);
  };

  if (!loading && !recommendations.length) {
    return (
      <Card className="mt-10" initial="hidden" animate="visible" variants={containerVariants}>
        <h2 className="mb-4 text-xl font-semibold text-slate-900">
          Latest Recommendations
        </h2>

        <p className="text-slate-500">
          No recommendations yet. Run a scan to analyze your infrastructure.
        </p>
      </Card>
    );
  }

  return (
    <Card className="mt-10" initial="hidden" animate="visible" variants={containerVariants}>
      <h2 id="recommendations-heading" className="mb-6 text-xl font-semibold text-slate-900">
        Latest Recommendations
      </h2>

      {loading ? (
        <RecommendationTableSkeleton />
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
                placeholder="Search by resource name or ID..."
                aria-label="Search recommendations"
                className="w-full rounded-xl border border-slate-200 bg-white/80 py-2.5 pl-9 pr-3 text-sm text-slate-700 placeholder:text-slate-400 transition focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <FilterSelect
                label="Severity"
                value={severityFilter}
                onChange={(value) => {
                  setSeverityFilter(value);
                  setCurrentPage(1);
                }}
                options={SEVERITY_OPTIONS}
              />

              <FilterSelect
                label="Status"
                value={statusFilter}
                onChange={(value) => {
                  setStatusFilter(value);
                  setCurrentPage(1);
                }}
                options={STATUS_OPTIONS}
              />

              <FilterSelect
                label="Resource Type"
                value={resourceTypeFilter}
                onChange={(value) => {
                  setResourceTypeFilter(value);
                  setCurrentPage(1);
                }}
                options={[
                  { value: "ALL", label: "All Types" },
                  ...resourceTypeOptions.map((type) => ({ value: type, label: type })),
                ]}
              />
            </div>
          </div>

          {filteredAndSorted.length === 0 ? (
            <NoResultsState message="No recommendations match your filters." onClear={clearFilters} />
          ) : (
            <>
              <div className="max-h-[420px] overflow-auto rounded-xl border border-slate-200">
                <table
                  className="w-full min-w-[760px] border-collapse text-sm"
                  aria-labelledby="recommendations-heading"
                >
                  <thead className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur">
                    <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {COLUMNS.map((column) => (
                        <SortableTh key={column.key} column={column} sortConfig={sortConfig} onSort={handleSort} />
                      ))}
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    <AnimatePresence initial={false}>
                      {paginated.map((item, index) => (
                        <motion.tr
                          key={item._id || `${item.resourceId}-${index}`}
                          custom={index}
                          initial="hidden"
                          animate="visible"
                          exit="exit"
                          variants={rowVariants}
                          whileHover={{ backgroundColor: "rgba(239, 246, 255, 0.6)" }}
                          whileTap={{ scale: 0.997 }}
                          onClick={() => setSelectedResource(item)}
                          className="cursor-pointer bg-white"
                        >
                          <td className="px-4 py-3.5">
                            <div className="font-medium text-slate-900">
                              {item.resourceName || item.resourceId || "N/A"}
                            </div>
                            <div className="mt-0.5 text-xs text-slate-400">
                              {item.resourceType || "—"} · {item.resourceId}
                            </div>
                          </td>

                          <td className="px-4 py-3.5 text-slate-600">
                            {item.instanceType || "—"}
                          </td>

                          <td className="px-4 py-3.5">
                            <Badge {...getSeverityBadgeStyle(item.severity)}>{item.severity}</Badge>
                          </td>

                          <td className="px-4 py-3.5" onClick={(event) => event.stopPropagation()}>
                            {item.status === "OPEN" ? (
                              <div className="flex flex-wrap gap-2">
                                {item.action === "STOP" && (
                                  <ActionButton
                                    variant="danger"
                                    icon={FaCircleStop}
                                    label="Stop Instance"
                                    loadingLabel="Stopping..."
                                    loading={stoppingId === item._id}
                                    onClick={() => handleStop(item._id)}
                                  />
                                )}

                                <ActionButton
                                  variant="warning"
                                  icon={FaBan}
                                  label="Ignore"
                                  loadingLabel="Ignoring..."
                                  loading={actionId === item._id}
                                  onClick={() => handleIgnore(item._id)}
                                />

                                <ActionButton
                                  variant="success"
                                  icon={FaCircleCheck}
                                  label="Resolve"
                                  loadingLabel="Resolving..."
                                  loading={actionId === item._id}
                                  onClick={() => handleResolve(item._id)}
                                />
                              </div>
                            ) : (
                              <span className="text-xs text-slate-400">—</span>
                            )}
                          </td>

                          <td className="px-4 py-3.5 font-medium text-slate-700">
                            {formatCurrency(item.estimatedSavings)}
                          </td>

                          <td className="px-4 py-3.5">
                            <Badge {...getRecommendationStatusBadgeStyle(item.status)}>
                              {item.status || "OPEN"}
                            </Badge>
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

      <ResourceDetailsDrawer
        resource={selectedResource}
        onClose={() => setSelectedResource(null)}
        onIgnore={handleIgnore}
        onResolve={handleResolve}
        onStop={handleStop}
        actionLoadingId={actionId}
        stoppingId={stoppingId}
        loading={loading}
      />
    </Card>
  );
};

export default RecommendationTable;
