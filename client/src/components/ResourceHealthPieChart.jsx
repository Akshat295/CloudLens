import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import ChartCard from "./ChartCard";
import ChartTooltip from "./ChartTooltip";
import ChartEmptyState from "./ChartEmptyState";
import ChartSkeleton from "./ChartSkeleton";
import { SEVERITY_COLORS } from "../utils/chartColors";

// Reframes the existing severity counts (highRecommendations/medium/low from
// GET /api/dashboard) as a resource-health readout.
const ResourceHealthPieChart = ({ data, index, loading = false }) => {
  const chartData = [
    { name: "Healthy", value: data.lowRecommendations || 0, color: SEVERITY_COLORS.LOW },
    { name: "Needs Attention", value: data.mediumRecommendations || 0, color: SEVERITY_COLORS.MEDIUM },
    { name: "Critical", value: data.highRecommendations || 0, color: SEVERITY_COLORS.HIGH },
  ];

  const total = chartData.reduce((sum, entry) => sum + entry.value, 0);

  return (
    <ChartCard
      title="Resource Health"
      subtitle="Recommendation severity across your infrastructure"
      index={index}
    >
      {loading ? (
        <ChartSkeleton variant="pie" />
      ) : total === 0 ? (
        <ChartEmptyState message="No scanned resources yet. Run a scan to see resource health." />
      ) : (
        <div className="h-[320px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={0}
                outerRadius={110}
                paddingAngle={2}
                isAnimationActive
                animationDuration={800}
                animationEasing="ease-out"
              >
                {chartData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} stroke="#fff" strokeWidth={2} />
                ))}
              </Pie>

              <Tooltip content={<ChartTooltip />} />
              <Legend verticalAlign="bottom" iconType="circle" />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </ChartCard>
  );
};

export default ResourceHealthPieChart;
