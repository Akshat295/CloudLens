// Custom Recharts tooltip content, styled to match the dashboard's glass
// aesthetic instead of Recharts' plain default tooltip box.
const ChartTooltip = ({ active, payload, label, formatter }) => {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-xl border border-slate-200 bg-white/95 px-4 py-3 text-sm shadow-lg backdrop-blur-xl">
      {label && <p className="mb-1 font-semibold text-slate-900">{label}</p>}

      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-2 text-slate-600">
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: entry.color || entry.fill }}
          />
          <span>{entry.name}:</span>
          <span className="font-semibold text-slate-900">
            {formatter ? formatter(entry.value, entry.payload) : entry.value}
          </span>
        </div>
      ))}
    </div>
  );
};

export default ChartTooltip;
