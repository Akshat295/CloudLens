import { motion } from "framer-motion";
import SortIcon from "./SortIcon";

// Shared sortable `<th>` for data tables: renders plain text for columns
// with no `sortKey`, otherwise a clickable header that toggles sort and
// exposes its state to assistive tech via `aria-sort`.
const SortableTh = ({ column, sortConfig, onSort }) => {
  const active = sortConfig?.key === column.sortKey;
  const ariaSort = !column.sortKey
    ? undefined
    : active
      ? sortConfig.direction === "asc"
        ? "ascending"
        : "descending"
      : "none";

  return (
    <th
      className="whitespace-nowrap border-b border-slate-200 px-4 py-3"
      aria-sort={ariaSort}
    >
      {column.sortKey ? (
        <motion.button
          type="button"
          onClick={() => onSort(column.sortKey)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-1.5 rounded transition hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
        >
          {column.label}
          <SortIcon active={active} direction={sortConfig?.direction} />
        </motion.button>
      ) : (
        column.label
      )}
    </th>
  );
};

export default SortableTh;
