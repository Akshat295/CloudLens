import { motion } from "framer-motion";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa6";

// Shared "Showing X-Y of Z" + prev/next pager, used by every paginated table.
const TablePagination = ({ page, totalPages, pageSize, totalItems, onPageChange }) => (
  <div className="mt-4 flex flex-col items-center justify-between gap-3 sm:flex-row">
    <p className="text-xs text-slate-500">
      Showing {totalItems === 0 ? 0 : (page - 1) * pageSize + 1}–
      {Math.min(page * pageSize, totalItems)} of {totalItems}
    </p>

    {totalPages > 1 && (
      <div className="flex items-center gap-2">
        <motion.button
          type="button"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page === 1}
          whileHover={page === 1 ? undefined : { scale: 1.08 }}
          whileTap={page === 1 ? undefined : { scale: 0.92 }}
          className="rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Previous page"
        >
          <FaChevronLeft size={12} />
        </motion.button>

        <span className="text-xs font-medium text-slate-600">
          Page {page} of {totalPages}
        </span>

        <motion.button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page === totalPages}
          whileHover={page === totalPages ? undefined : { scale: 1.08 }}
          whileTap={page === totalPages ? undefined : { scale: 0.92 }}
          className="rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Next page"
        >
          <FaChevronRight size={12} />
        </motion.button>
      </div>
    )}
  </div>
);

export default TablePagination;
