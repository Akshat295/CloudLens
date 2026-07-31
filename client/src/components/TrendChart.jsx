import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import ChartCard from "./ChartCard";
import ChartTooltip from "./ChartTooltip";
import ChartSkeleton from "./ChartSkeleton";
import ChartEmptyState from "./ChartEmptyState";
import { formatDateTime } from "../utils/format";

const shortDate = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ""
    : date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

// Shared time-series chart for every analytics trend (cost, savings,
// resource growth, high alerts) — one scan = one point on the X axis,
// consistent with each scan already being a historical summary snapshot.
const TrendChart = ({
  title,
  subtitle,
  index,
  data,
  dataKey,
  seriesName,
  color,
  valueFormatter,
  loading = false,
  variant = "line",
  emptyMessage = "No scan history yet — run a scan to start building trend data.",
}) => {
  const ChartComponent = variant === "area" ? AreaChart : LineChart;

  return (
    <ChartCard title={title} subtitle={subtitle} index={index}>
      {loading ? (
        <ChartSkeleton variant="bar" />
      ) : !data.length ? (
        <ChartEmptyState message={emptyMessage} />
      ) : (
        <div className="h-[320px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ChartComponent data={data} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis
                dataKey="date"
                tickFormatter={shortDate}
                tickLine={false}
                axisLine={{ stroke: "#e2e8f0" }}
                tick={{ fill: "#64748b", fontSize: 12 }}
                minTickGap={24}
              />
              <YAxis
                allowDecimals={false}
                tickFormatter={valueFormatter}
                tickLine={false}
                axisLine={false}
                tick={{ fill: "#64748b", fontSize: 12 }}
                width={60}
              />
              <Tooltip
                content={<ChartTooltip formatter={valueFormatter} />}
                labelFormatter={(value) => formatDateTime(value)}
                cursor={{ stroke: "#cbd5e1", strokeDasharray: "3 3" }}
              />
              {variant === "area" ? (
                <Area
                  type="monotone"
                  dataKey={dataKey}
                  name={seriesName}
                  stroke={color}
                  fill={color}
                  fillOpacity={0.15}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                  isAnimationActive
                  animationDuration={800}
                  animationEasing="ease-out"
                />
              ) : (
                <Line
                  type="monotone"
                  dataKey={dataKey}
                  name={seriesName}
                  stroke={color}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                  isAnimationActive
                  animationDuration={800}
                  animationEasing="ease-out"
                />
              )}
            </ChartComponent>
          </ResponsiveContainer>
        </div>
      )}
    </ChartCard>
  );
};

export default TrendChart;
