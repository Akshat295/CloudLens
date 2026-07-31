import { useMemo } from "react";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import ChartCard from "./ChartCard";
import ChartTooltip from "./ChartTooltip";
import ChartEmptyState from "./ChartEmptyState";
import ChartSkeleton from "./ChartSkeleton";
import { CATEGORICAL_PALETTE } from "../utils/chartColors";
import { formatCurrency } from "../utils/format";

const MAX_SLICES = 6;

// Consumes GET /api/dashboard's costBreakdown (one entry per service, $0
// included for services with no pricing data) instead of deriving cost
// per-resource client-side. Services beyond MAX_SLICES-1 fold into "Other"
// so the donut stays readable as more services are scanned.
const foldIntoSlices = (costBreakdown) => {
  const sorted = costBreakdown.map((entry) => ({ name: entry.service, value: entry.cost })).sort((a, b) => b.value - a.value);

  if (sorted.length <= MAX_SLICES) return sorted;

  const top = sorted.slice(0, MAX_SLICES - 1);
  const otherTotal = sorted.slice(MAX_SLICES - 1).reduce((sum, entry) => sum + entry.value, 0);

  return [...top, { name: "Other", value: otherTotal }];
};

const CostBreakdownDonutChart = ({ costBreakdown = [], index, loading = false }) => {
  const chartData = useMemo(() => foldIntoSlices(costBreakdown), [costBreakdown]);
  const total = chartData.reduce((sum, entry) => sum + entry.value, 0);

  return (
    <ChartCard
      title="Cost Breakdown"
      subtitle={loading ? "Monthly cost by service" : `Monthly cost by service · Total ${formatCurrency(total)}`}
      index={index}
    >
      {loading ? (
        <ChartSkeleton variant="pie" />
      ) : total === 0 ? (
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
