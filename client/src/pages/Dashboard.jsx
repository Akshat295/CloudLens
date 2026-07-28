import { motion } from "framer-motion";
import {
  FaServer,
  FaPlay,
  FaStop,
  FaDollarSign,
  FaTriangleExclamation,
  FaCircleExclamation,
  FaCircleCheck,
} from "react-icons/fa6";

import Navbar from "../components/Navbar";
import PageTransition from "../components/PageTransition";
import HeroSection from "../components/HeroSection";
import SummaryCard from "../components/SummaryCard";
import ErrorBanner from "../components/ErrorBanner";
import ResourceHealthPieChart from "../components/ResourceHealthPieChart";
import CostBreakdownDonutChart from "../components/CostBreakdownDonutChart";
import ResourceDistributionBarChart from "../components/ResourceDistributionBarChart";
import SavingsOpportunityBarChart from "../components/SavingsOpportunityBarChart";
import RecommendationTable from "../components/RecommendationTable";

import { getDashboard } from "../services/dashboard.service";
import { getRecommendations } from "../services/recommendation.service";
import { getScans } from "../services/scan.service";
import { useAsyncData } from "../hooks/useAsyncData";
import { useScanTrigger } from "../hooks/useScanTrigger";
import { formatCurrency } from "../utils/format";

const fetchDashboardBundle = async () => {
  const [dashboard, recommendations, scans] = await Promise.all([
    getDashboard(),
    getRecommendations(),
    getScans(),
  ]);

  return { dashboard, recommendations, lastScan: scans[0] || null };
};

const Dashboard = () => {
  const { data, setData, error, loading, refetch } = useAsyncData(
    fetchDashboardBundle,
    [],
    { errorMessage: "Failed to load dashboard data. Is the backend server running?" }
  );

  const { scanning, scanError, runScan, stepIndex, scanPhase } = useScanTrigger(refetch);

  const handleRecommendationUpdate = (updated) => {
    setData((prev) => ({
      ...prev,
      recommendations: prev.recommendations.map((rec) =>
        rec._id === updated._id ? { ...rec, ...updated } : rec
      ),
    }));
  };

  if (error && !data) {
    return (
      <PageTransition className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 p-6 text-center dark:bg-slate-950">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-slate-200 bg-white p-8 shadow-lg dark:border-white/10 dark:bg-slate-900"
        >
          <p className="text-xl font-semibold text-red-600 dark:text-red-400">{error}</p>
          <motion.button
            onClick={refetch}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="mt-4 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white shadow-md shadow-blue-500/20 transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
          >
            Retry
          </motion.button>
        </motion.div>
      </PageTransition>
    );
  }

  const isLoading = loading || !data;
  const dashboardData = data?.dashboard || {};
  const recommendations = data?.recommendations || [];
  const lastScan = data?.lastScan || null;

  return (
    <PageTransition className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 p-4 dark:from-slate-950 dark:to-slate-900 sm:p-6 lg:p-8">
      <Navbar onScan={runScan} scanning={scanning} stepIndex={stepIndex} scanPhase={scanPhase} />

      <ErrorBanner message={error || scanError} className="mt-6" />

      <div className="mt-6">
        <HeroSection
          totalResources={dashboardData.totalResources}
          monthlyCost={dashboardData.monthlyCost}
          estimatedSavings={dashboardData.estimatedSavings}
          lastScan={lastScan}
          loading={isLoading}
        />
      </div>

      <div className="mt-8 grid gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        <SummaryCard
          index={0}
          title="Resources"
          value={dashboardData.totalResources}
          icon={<FaServer size={24} />}
          gradient="from-blue-500 to-indigo-500"
          loading={isLoading}
        />

        <SummaryCard
          index={1}
          title="Running"
          value={dashboardData.runningResources}
          icon={<FaPlay size={20} />}
          gradient="from-emerald-500 to-green-500"
          loading={isLoading}
        />

        <SummaryCard
          index={2}
          title="Stopped"
          value={dashboardData.stoppedResources}
          icon={<FaStop size={20} />}
          gradient="from-rose-500 to-red-500"
          loading={isLoading}
        />

        <SummaryCard
          index={3}
          title="Monthly Cost"
          value={dashboardData.monthlyCost}
          format={formatCurrency}
          icon={<FaDollarSign size={22} />}
          gradient="from-amber-500 to-orange-500"
          loading={isLoading}
        />

        <SummaryCard
          index={4}
          title="Estimated Savings"
          value={dashboardData.estimatedSavings}
          format={formatCurrency}
          icon={<FaDollarSign size={22} />}
          gradient="from-teal-500 to-emerald-500"
          loading={isLoading}
        />

        <SummaryCard
          index={5}
          title="High Alerts"
          value={dashboardData.highRecommendations}
          icon={<FaTriangleExclamation size={22} />}
          gradient="from-red-500 to-rose-600"
          loading={isLoading}
        />

        <SummaryCard
          index={6}
          title="Medium Alerts"
          value={dashboardData.mediumRecommendations}
          icon={<FaCircleExclamation size={22} />}
          gradient="from-amber-500 to-yellow-500"
          loading={isLoading}
        />

        <SummaryCard
          index={7}
          title="Low Alerts"
          value={dashboardData.lowRecommendations}
          icon={<FaCircleCheck size={22} />}
          gradient="from-green-500 to-emerald-500"
          loading={isLoading}
        />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-2">
        <ResourceHealthPieChart data={dashboardData} index={0} loading={isLoading} />
        <CostBreakdownDonutChart recommendations={recommendations} index={1} loading={isLoading} />
        <ResourceDistributionBarChart data={dashboardData} index={2} loading={isLoading} />
        <SavingsOpportunityBarChart recommendations={recommendations} index={3} loading={isLoading} />
      </div>

      <RecommendationTable
        recommendations={recommendations}
        onRecommendationUpdate={handleRecommendationUpdate}
        refresh={refetch}
        loading={isLoading}
      />
    </PageTransition>
  );
};

export default Dashboard;
