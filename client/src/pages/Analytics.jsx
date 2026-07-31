import Navbar from "../components/Navbar";
import PageTransition from "../components/PageTransition";
import ErrorBanner from "../components/ErrorBanner";
import TrendChart from "../components/TrendChart";
import { useAsyncData } from "../hooks/useAsyncData";
import { useScanTrigger } from "../hooks/useScanTrigger";
import {
  getCostTrend,
  getSavingsTrend,
  getResourceGrowth,
  getHighAlertsTrend,
} from "../services/analytics.service";
import { formatCurrency } from "../utils/format";
import { CHART_COLORS } from "../utils/chartColors";

const formatCount = (value) => `${value ?? 0}`;

const EMPTY_ANALYTICS = { costTrend: [], savingsTrend: [], resourceGrowth: [], highAlertsTrend: [] };

const fetchAnalyticsBundle = async () => {
  const [costTrend, savingsTrend, resourceGrowth, highAlertsTrend] = await Promise.all([
    getCostTrend(),
    getSavingsTrend(),
    getResourceGrowth(),
    getHighAlertsTrend(),
  ]);

  return { costTrend, savingsTrend, resourceGrowth, highAlertsTrend };
};

const Analytics = () => {
  const { data, loading, error } = useAsyncData(fetchAnalyticsBundle, [], {
    initialValue: EMPTY_ANALYTICS,
    errorMessage: "Failed to load analytics data.",
  });

  const { scanning, scanError, runScan, stepIndex, scanPhase } = useScanTrigger();

  return (
    <PageTransition className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 p-4 dark:from-slate-950 dark:to-slate-900 sm:p-6 lg:p-8">
      <Navbar onScan={runScan} scanning={scanning} stepIndex={stepIndex} scanPhase={scanPhase} />

      <div className="mt-6">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Cost Analytics</h2>
        <p className="mt-1 text-slate-500 dark:text-slate-400">
          Trends across every completed scan.
        </p>
      </div>

      <ErrorBanner message={error || scanError} className="mt-6" />

      <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-2">
        <TrendChart
          title="Monthly Cost Trend"
          subtitle="Total monthly AWS cost at each scan"
          index={0}
          data={data.costTrend}
          dataKey="monthlyCost"
          seriesName="Monthly Cost"
          color={CHART_COLORS.blue}
          valueFormatter={formatCurrency}
          loading={loading}
        />

        <TrendChart
          title="Estimated Savings Trend"
          subtitle="Potential monthly savings at each scan"
          index={1}
          data={data.savingsTrend}
          dataKey="estimatedSavings"
          seriesName="Estimated Savings"
          color={CHART_COLORS.emerald}
          valueFormatter={formatCurrency}
          loading={loading}
        />

        <TrendChart
          title="Resources Growth"
          subtitle="Total resources discovered at each scan"
          index={2}
          data={data.resourceGrowth}
          dataKey="totalResources"
          seriesName="Resources"
          color={CHART_COLORS.indigo}
          valueFormatter={formatCount}
          variant="area"
          loading={loading}
        />

        <TrendChart
          title="High Alerts Trend"
          subtitle="High-severity recommendations at each scan"
          index={3}
          data={data.highAlertsTrend}
          dataKey="highAlerts"
          seriesName="High Alerts"
          color={CHART_COLORS.red}
          valueFormatter={formatCount}
          loading={loading}
        />
      </div>
    </PageTransition>
  );
};

export default Analytics;
