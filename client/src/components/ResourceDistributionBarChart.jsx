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
import ChartSkeleton from "./ChartSkeleton";
import { RESOURCE_STATE_COLORS } from "../utils/chartColors";

const ResourceDistributionBarChart = ({ data, index, loading = false }) => {
  const chartData = [
    { name: "Running", count: data.runningResources || 0, color: RESOURCE_STATE_COLORS.running },
    { name: "Stopped", count: data.stoppedResources || 0, color: RESOURCE_STATE_COLORS.stopped },
  ];

  // A single <Bar> with per-<Cell> colors doesn't get distinct legend
  // entries automatically in Recharts, so the color key is supplied
  // explicitly via the Legend's `payload` prop.
  const legendPayload = chartData.map((entry) => ({
    value: entry.name,
    type: "circle",
    color: entry.color,
  }));

  return (
    <ChartCard title="Resource Distribution" subtitle="Running vs. stopped resources" index={index}>
      {loading ? (
        <ChartSkeleton variant="bar" />
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
                {chartData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
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
