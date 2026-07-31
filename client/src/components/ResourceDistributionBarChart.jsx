import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
} from "recharts";
import ChartCard from "./ChartCard";
import ChartTooltip from "./ChartTooltip";
import ChartEmptyState from "./ChartEmptyState";
import ChartSkeleton from "./ChartSkeleton";
import { CATEGORICAL_PALETTE } from "../utils/chartColors";

// Consumes GET /api/dashboard's resourceDistribution — resource count per
// service, replacing the old EC2-only Running-vs-Stopped breakdown. One bar
// per service that showed up in the latest scan; a brand new service just
// adds another bar automatically.
const ResourceDistributionBarChart = ({ resourceDistribution = [], index, loading = false }) => {
  const chartData = resourceDistribution.map((entry) => ({ name: entry.service, count: entry.count }));

  // A single <Bar> with per-<Cell> colors doesn't get distinct legend
  // entries automatically in Recharts, so the color key is supplied
  // explicitly via the Legend's `payload` prop — same approach the old
  // Running/Stopped version used, just built from however many services
  // actually showed up instead of two fixed categories.
  const legendPayload = chartData.map((entry, i) => ({
    value: entry.name,
    type: "circle",
    color: CATEGORICAL_PALETTE[i % CATEGORICAL_PALETTE.length],
  }));

  return (
    <ChartCard title="Resource Distribution" subtitle="Resources per service" index={index}>
      {loading ? (
        <ChartSkeleton variant="bar" />
      ) : !chartData.length ? (
        <ChartEmptyState message="No scanned resources yet. Run a scan to see resource distribution." />
      ) : (
        <div className="h-[320px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} barCategoryGap="35%">
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis
                dataKey="name"
                tickLine={false}
                axisLine={{ stroke: "#e2e8f0" }}
                tick={{ fill: "#64748b", fontSize: 13 }}
              />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: "#64748b", fontSize: 13 }} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(148, 163, 184, 0.12)" }} />
              <Legend payload={legendPayload} />
              <Bar
                dataKey="count"
                name="Resources"
                radius={[10, 10, 0, 0]}
                isAnimationActive
                animationDuration={800}
                animationEasing="ease-out"
              >
                {chartData.map((entry, i) => (
                  <Cell key={entry.name} fill={CATEGORICAL_PALETTE[i % CATEGORICAL_PALETTE.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </ChartCard>
  );
};

export default ResourceDistributionBarChart;
