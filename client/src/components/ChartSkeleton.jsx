import Skeleton from "react-loading-skeleton";

const BAR_HEIGHTS = [55, 90, 40, 100, 70];

// Placeholder shown inside a ChartCard while its data is still loading.
// `variant` picks a shape that roughly matches the real chart it stands in
// for, so the loading state doesn't look generic/unrelated to the content.
const ChartSkeleton = ({ variant = "bar" }) => (
  <div className="flex h-[320px] w-full flex-col items-center justify-center gap-8">
    {variant === "pie" ? (
      <Skeleton circle width={180} height={180} />
    ) : variant === "horizontal-bar" ? (
      <div className="flex w-full flex-col gap-4 px-4">
        {[90, 70, 100, 55, 80].map((width, i) => (
          <Skeleton key={i} height={20} width={`${width}%`} />
        ))}
      </div>
    ) : (
      <div className="flex h-48 w-full items-end justify-center gap-4 px-8">
        {BAR_HEIGHTS.map((height, i) => (
          <Skeleton key={i} height={height} width={32} />
        ))}
      </div>
    )}

    <div className="flex flex-wrap items-center justify-center gap-3">
      <Skeleton width={64} height={12} />
      <Skeleton width={64} height={12} />
      <Skeleton width={64} height={12} />
    </div>
  </div>
);

export default ChartSkeleton;
