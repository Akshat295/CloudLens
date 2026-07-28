import Skeleton from "react-loading-skeleton";

// Generic column-driven table skeleton, reused by both ScanHistory's scan
// list and ScanDetail's ResourceTable — simpler tables than
// RecommendationTable, so one shared shape covers both.
const TableSkeleton = ({ columns, rows = 6 }) => (
  <div className="overflow-x-auto">
    <table className="w-full">
      <thead className="border-b">
        <tr className="text-left">
          {columns.map((label) => (
            <th key={label} className="pb-4">
              {label}
            </th>
          ))}
        </tr>
      </thead>

      <tbody>
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <tr key={rowIndex} className="border-b">
            {columns.map((label, colIndex) => (
              <td key={label} className="py-4 pr-4">
                <Skeleton width={colIndex === 0 ? 140 : 80} height={13} />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default TableSkeleton;
