const ChartEmptyState = ({ message, height = 320 }) => (
  <div
    className="flex w-full flex-col items-center justify-center gap-2 text-center"
    style={{ height }}
  >
    <p className="text-sm text-slate-400">{message}</p>
  </div>
);

export default ChartEmptyState;
