import { useMemo } from "react";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import ChartCard from "./ChartCard";
import ChartTooltip from "./ChartTooltip";
import ChartEmptyState from "./ChartEmptyState";
import ChartSkeleton from "./ChartSkeleton";
import { CATEGORICAL_PALETTE } from "../utils/chartColors";
import { formatCurrency } from "../utils/format";

const MAX_SLICES = 6;

// Builds a per-resource cost breakdown from the recommendations already
// fetched for the dashboard (GET /api/recommendations) — no separate API.
// Resources beyond the top MAX_SLICES-1 are folded into "Other" so the
// donut stays readable as the fleet grows.
const buildCostBreakdown = (recommendations) => {
  const costed = recommendations
    .filter((rec) => (rec.monthlyCost || 0) > 0)
    .map((rec) => ({
      name: rec.resourceName || rec.resourceId,
      value: rec.monthlyCost,
    }))
    .sort((a, b) => b.value - a.value);

  if (costed.length <= MAX_SLICES) return costed;

  const top = costed.slice(0, MAX_SLICES - 1);
  const otherTotal = costed
    .slice(MAX_SLICES - 1)
    .reduce((sum, entry) => sum + entry.value, 0);

  return [...top, { name: "Other", value: otherTotal }];
};

const CostBreakdownDonutChart = ({ recommendations = [], index, loading = false }) => {
  const chartData = useMemo(() => buildCostBreakdown(recommendations), [recommendations]);
  const total = chartData.reduce((sum, entry) => sum + entry.value, 0);

  return (
    <ChartCard
      title="Cost Breakdown"
      subtitle={loading ? "Monthly cost by resource" : `Monthly cost by resource · Total ${formatCurrency(total)}`}
      index={index}
    >
      {loading ? (
        <ChartSkeleton variant="pie" />
      ) : !chartData.length ? (
        <ChartEmptyState message="No cost data yet. Run a scan to see your cost breakdown." />
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
                innerRadius={68}
                outerRadius={110}
                paddingAngle={chartData.length > 1 ? 3 : 0}
                isAnimationActive
                animationDuration={800}
                animationEasing="ease-out"
              >
                {chartData.map((entry, i) => (
                  <Cell
                    key={entry.name}
                    fill={CATEGORICAL_PALETTE[i % CATEGORICAL_PALETTE.length]}
                    stroke="#fff"
                    strokeWidth={2}
                  />
                ))}
              </Pie>

              <Tooltip content={<ChartTooltip formatter={(value) => formatCurrency(value)} />} />
              <Legend verticalAlign="bottom" iconType="circle" />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </ChartCard>
  );
};

export default CostBreakdownDonutChart;
