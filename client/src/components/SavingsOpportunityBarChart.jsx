import { useMemo } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LabelList,
} from "recharts";
import ChartCard from "./ChartCard";
import ChartTooltip from "./ChartTooltip";
import ChartEmptyState from "./ChartEmptyState";
import ChartSkeleton from "./ChartSkeleton";
import { CHART_COLORS } from "../utils/chartColors";
import { formatCurrency } from "../utils/format";

const MAX_BARS = 8;
const ROW_HEIGHT = 48;
const MIN_HEIGHT = 240;

// Ranks resources from the already-fetched recommendations by how much
// estimated monthly savings each one represents.
const buildSavingsData = (recommendations) =>
  recommendations
    .filter((rec) => (rec.estimatedSavings || 0) > 0)
    .map((rec) => ({
      name: rec.resourceName || rec.resourceId,
      savings: rec.estimatedSavings,
    }))
    .sort((a, b) => b.savings - a.savings)
    .slice(0, MAX_BARS);

const SavingsOpportunityBarChart = ({ recommendations = [], index, loading = false }) => {
  const chartData = useMemo(() => buildSavingsData(recommendations), [recommendations]);
  const height = Math.max(MIN_HEIGHT, chartData.length * ROW_HEIGHT);

  return (
    <ChartCard
      title="Savings Opportunities"
      subtitle="Top resources by potential monthly savings"
      index={index}
    >
      {loading ? (
        <ChartSkeleton variant="horizontal-bar" />
      ) : !chartData.length ? (
        <ChartEmptyState message="No savings opportunities found — your infrastructure looks well optimized." />
      ) : (
        <div className="w-full" style={{ height }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ top: 4, right: 32, bottom: 4, left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
              <XAxis
                type="number"
                tickFormatter={(value) => formatCurrency(value)}
                tickLine={false}
                axisLine={{ stroke: "#e2e8f0" }}
                tick={{ fill: "#64748b", fontSize: 12 }}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={140}
                tickLine={false}
                axisLine={false}
                tick={{ fill: "#334155", fontSize: 13 }}
              />
              <Tooltip
                content={<ChartTooltip formatter={(value) => formatCurrency(value)} />}
                cursor={{ fill: "rgba(148, 163, 184, 0.12)" }}
              />
              <Legend />
              <Bar
                dataKey="savings"
                name="Estimated Savings"
                fill={CHART_COLORS.emerald}
                radius={[0, 10, 10, 0]}
                isAnimationActive
                animationDuration={800}
                animationEasing="ease-out"
              >
                <LabelList
                  dataKey="savings"
                  position="right"
                  formatter={(value) => formatCurrency(value)}
                  fill="#334155"
                  fontSize={12}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </ChartCard>
  );
};

export default SavingsOpportunityBarChart;
