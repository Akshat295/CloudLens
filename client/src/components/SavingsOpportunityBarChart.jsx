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

const ROW_HEIGHT = 48;
const MIN_HEIGHT = 240;

// Consumes GET /api/dashboard's savingsOpportunities as-is — already
// service-agnostic, already sorted highest-savings-first (with $0
// configuration-only recommendations naturally sorted last), and already
// capped to a reasonable count server-side, so this component just renders
// what it's given instead of filtering/sorting recommendations itself.
const SavingsOpportunityBarChart = ({ savingsOpportunities = [], index, loading = false }) => {
  const chartData = savingsOpportunities.map((entry) => ({ name: entry.resource, savings: entry.savings }));
  const height = Math.max(MIN_HEIGHT, chartData.length * ROW_HEIGHT);

  return (
    <ChartCard
      title="Savings Opportunities"
      subtitle="Top recommendations by potential monthly savings, across every service"
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
