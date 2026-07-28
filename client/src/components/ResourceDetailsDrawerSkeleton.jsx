import Skeleton from "react-loading-skeleton";

// Mirrors ResourceDetailsDrawer's real layout (header, badges, stat tiles,
// recommendation panel, detail rows) so that if a `loading` resource is ever
// passed in — e.g. a future async resource-detail fetch — the drawer keeps
// its familiar shape instead of jumping around as content pops in.
const ResourceDetailsDrawerSkeleton = () => (
  <div className="flex h-full flex-col">
    <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
      <div className="min-w-0 flex-1">
        <Skeleton width={80} height={11} />
        <div className="mt-2">
          <Skeleton width="70%" height={20} />
        </div>
        <div className="mt-1.5">
          <Skeleton width="45%" height={13} />
        </div>
      </div>
    </div>

    <div className="flex-1 overflow-y-auto px-6 py-5">
      <div className="mb-5 flex gap-2">
        <Skeleton width={72} height={24} borderRadius="9999px" />
        <Skeleton width={110} height={24} borderRadius="9999px" />
      </div>

      <div className="mb-6 grid grid-cols-3 gap-2 sm:gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-slate-100 bg-slate-50/80 p-3 text-center">
            <Skeleton width={50} height={10} />
            <div className="mt-2">
              <Skeleton width={60} height={18} />
            </div>
          </div>
        ))}
      </div>

      <div className="mb-6 rounded-xl border border-slate-100 bg-slate-50/60 p-4">
        <Skeleton width={140} height={13} />
        <div className="mt-2">
          <Skeleton count={2} height={12} />
        </div>

        <div className="mt-4">
          <Skeleton width={70} height={13} />
        </div>
        <div className="mt-2">
          <Skeleton height={12} />
        </div>
      </div>

      <div className="rounded-xl border border-slate-100 bg-slate-50/60 px-4">
        {Array.from({ length: 7 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center justify-between gap-4 border-b border-slate-100 py-2.5 last:border-b-0"
          >
            <Skeleton width={90} height={12} />
            <Skeleton width={110} height={12} />
          </div>
        ))}
      </div>
    </div>

    <div className="flex items-center gap-2 border-t border-slate-100 px-6 py-4">
      <Skeleton width={90} height={32} borderRadius="0.5rem" />
      <Skeleton width={80} height={32} borderRadius="0.5rem" />
      <Skeleton width={85} height={32} borderRadius="0.5rem" />
    </div>
  </div>
);

export default ResourceDetailsDrawerSkeleton;
