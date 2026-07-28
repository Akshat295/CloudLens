import { motion } from "framer-motion";
import TableSkeleton from "./TableSkeleton";

const COLUMNS = ["Name", "Instance ID", "Type", "State", "Availability Zone"];

const rowVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: (index) => ({
    opacity: 1,
    y: 0,
    transition: { delay: Math.min(index, 10) * 0.03, duration: 0.3, ease: "easeOut" },
  }),
};

// Mirrors RecommendationTable/ScanHistory's table shell (rounded bordered
// wrapper, slate header, divided rows) so every data table in the app reads
// as one consistent component, not a one-off.
const ResourceTable = ({ resources = [], loading = false }) => {
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

  return (
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
          {resources.map((resource, index) => (
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
              <td className="px-4 py-3 text-slate-600">{resource.resourceId}</td>
              <td className="px-4 py-3 text-slate-600">
                {resource.metadata?.instanceType || "N/A"}
              </td>
              <td className="px-4 py-3">
                <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold capitalize text-slate-700">
                  {resource.state || "N/A"}
                </span>
              </td>
              <td className="px-4 py-3 text-slate-600">
                {resource.metadata?.availabilityZone || "N/A"}
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ResourceTable;
