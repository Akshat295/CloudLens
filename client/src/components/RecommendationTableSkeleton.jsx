import Skeleton from "react-loading-skeleton";

const ROWS = 6;
const COLUMN_LABELS = ["Resource", "Instance Type", "Severity", "Actions", "Savings", "Status"];

// Mirrors RecommendationTable's real toolbar + table shape (not styled for
// dark mode, same as the table itself — see index.css for why).
const RecommendationTableSkeleton = () => (
  <div>
    <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="w-full lg:max-w-xs">
        <Skeleton height={42} borderRadius="0.75rem" />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Skeleton height={42} width={140} borderRadius="0.75rem" />
        <Skeleton height={42} width={140} borderRadius="0.75rem" />
        <Skeleton height={42} width={140} borderRadius="0.75rem" />
      </div>
    </div>

    <div className="overflow-hidden rounded-xl border border-slate-200">
      <table className="w-full min-w-[760px] border-collapse text-sm">
        <thead className="bg-slate-50/95">
          <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            {COLUMN_LABELS.map((label) => (
              <th key={label} className="whitespace-nowrap px-4 py-3">
                {label}
              </th>
            ))}
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-100">
          {Array.from({ length: ROWS }).map((_, rowIndex) => (
            <tr key={rowIndex}>
              <td className="px-4 py-3.5">
                <div className="mb-1.5">
                  <Skeleton width={140} height={13} />
                </div>
                <Skeleton width={90} height={11} />
              </td>

              <td className="px-4 py-3.5">
                <Skeleton width={64} height={13} />
              </td>

              <td className="px-4 py-3.5">
                <Skeleton width={68} height={22} borderRadius="9999px" />
              </td>

              <td className="px-4 py-3.5">
                <div className="flex gap-2">
                  <Skeleton width={72} height={28} borderRadius="0.5rem" />
                  <Skeleton width={72} height={28} borderRadius="0.5rem" />
                </div>
              </td>

              <td className="px-4 py-3.5">
                <Skeleton width={56} height={13} />
              </td>

              <td className="px-4 py-3.5">
                <Skeleton width={68} height={22} borderRadius="9999px" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

export default RecommendationTableSkeleton;
