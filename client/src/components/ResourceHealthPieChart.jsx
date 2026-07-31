import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import ChartCard from "./ChartCard";
import ChartTooltip from "./ChartTooltip";
import ChartEmptyState from "./ChartEmptyState";
import ChartSkeleton from "./ChartSkeleton";
import { RESOURCE_HEALTH_COLORS } from "../utils/chartColors";

// Consumes GET /api/dashboard's severitySummary — five service-agnostic
// buckets computed across every scanned service's recommendations, not just
// EC2/IAM/S3/RDS's individual severity counts.
const ResourceHealthPieChart = ({ severitySummary = {}, index, loading = false }) => {
  const chartData = [
    { name: "Critical", value: severitySummary.critical || 0, color: RESOURCE_HEALTH_COLORS.CRITICAL },
    { name: "High", value: severitySummary.high || 0, color: RESOURCE_HEALTH_COLORS.HIGH },
    { name: "Medium", value: severitySummary.medium || 0, color: RESOURCE_HEALTH_COLORS.MEDIUM },
    { name: "Low", value: severitySummary.low || 0, color: RESOURCE_HEALTH_COLORS.LOW },
    { name: "Healthy", value: severitySummary.healthy || 0, color: RESOURCE_HEALTH_COLORS.HEALTHY },
  ].filter((entry) => entry.value > 0);

  const total = chartData.reduce((sum, entry) => sum + entry.value, 0);

  return (
    <ChartCard
      title="Resource Health"
      subtitle="Recommendation severity across every scanned service"
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
