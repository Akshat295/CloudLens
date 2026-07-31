import { useState } from "react";
import { motion } from "framer-motion";
import TableSkeleton from "./TableSkeleton";
import TablePagination from "./TablePagination";

const PAGE_SIZE = 10;

const COLUMNS = ["Name", "Resource Type", "Resource ID", "State", "Details"];

const rowVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: (index) => ({
    opacity: 1,
    y: 0,
    transition: { delay: Math.min(index, 10) * 0.03, duration: 0.3, ease: "easeOut" },
  }),
};

// The single "headline" fact worth showing per service without hardcoding
// this table to EC2 — mirrors the resourceType-conditional sections already
// used in ResourceDetailsDrawer.jsx. Anything not listed (a future Lambda,
// EBS, ...) falls back to "—" instead of a blank/broken cell.
const getResourceDetail = (resource) => {
  const metadata = resource.metadata || {};

  switch (resource.resourceType) {
    case "EC2":
      return metadata.instanceType || "—";
    case "RDS":
      return metadata.instanceClass || "—";
    case "S3":
      return metadata.region || "—";
    case "IAM_USER":
      return metadata.hasAdminAccess ? "Admin access" : "Standard user";
    case "IAM_ROLE": {
      const count = metadata.attachedPolicies?.length ?? 0;
      return `${count} attached polic${count === 1 ? "y" : "ies"}`;
    }
    default:
      return "—";
  }
};

// Mirrors RecommendationTable/ScanHistory's table shell (rounded bordered
// wrapper, slate header, divided rows) so every data table in the app reads
// as one consistent component, not a one-off.
const ResourceTable = ({ resources = [], loading = false }) => {
  const [currentPage, setCurrentPage] = useState(1);

  if (loading) {
    return <TableSkeleton columns={COLUMNS} />;
  }

  if (!resources.length) {
    return (
      <p className="text-slate-500">
        No resources found for this scan.
      </p>
    );
  }

  const totalPages = Math.max(1, Math.ceil(resources.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const paginated = resources.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <>
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead className="bg-slate-50/95">
            <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              {COLUMNS.map((label) => (
                <th key={label} className="whitespace-nowrap border-b border-slate-200 px-4 py-3">
                  {label}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {paginated.map((resource, index) => (
              <motion.tr
                key={resource._id}
                custom={index}
                initial="hidden"
                animate="visible"
                variants={rowVariants}
                whileHover={{ backgroundColor: "rgba(248, 250, 252, 1)" }}
                className="bg-white"
              >
                <td className="px-4 py-3 font-medium text-slate-900">
                  {resource.name || "N/A"}
                </td>
                <td className="px-4 py-3 text-slate-600">{resource.resourceType || "N/A"}</td>
                <td className="px-4 py-3 text-slate-600">{resource.resourceId}</td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold capitalize text-slate-700">
                    {resource.state || "N/A"}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-600">{getResourceDetail(resource)}</td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      <TablePagination
        page={safePage}
        totalPages={totalPages}
        pageSize={PAGE_SIZE}
        totalItems={resources.length}
        onPageChange={setCurrentPage}
      />
    </>
  );
};

export default ResourceTable;
