import { motion } from "framer-motion";
import {
  FaServer,
  FaPlay,
  FaStop,
  FaDollarSign,
  FaTriangleExclamation,
  FaCircleExclamation,
  FaCircleCheck,
  FaMicrochip,
  FaNetworkWired,
  FaHardDrive,
  FaMoon,
  FaClockRotateLeft,
  FaShieldHalved,
  FaUser,
  FaUserGroup,
  FaKey,
  FaUserGear,
  FaGaugeHigh,
} from "react-icons/fa6";

import Navbar from "../components/Navbar";
import PageTransition from "../components/PageTransition";
import HeroSection from "../components/HeroSection";
import SummaryCard from "../components/SummaryCard";
import AIInsightsCard from "../components/AIInsightsCard";
import ServiceOverviewGrid from "../components/ServiceOverviewGrid";
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
import { formatCurrency, formatPercent, formatBytes } from "../utils/format";

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

      <div className="mt-6">
        <AIInsightsCard insights={dashboardData.aiInsights} loading={isLoading} />
      </div>

      <h2 className="mt-10 mb-4 text-xl font-semibold text-slate-900 dark:text-white">Resources by Service</h2>

      <ServiceOverviewGrid services={dashboardData.serviceSummary} loading={isLoading} />

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

      <h2 className="mt-10 mb-4 text-xl font-semibold text-slate-900 dark:text-white">Recommendation Categories</h2>

      <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3">
        <SummaryCard
          index={0}
          title="Security Findings"
          value={dashboardData.categoryStats?.securityFindings}
          icon={<FaShieldHalved size={22} />}
          gradient="from-red-500 to-rose-600"
          loading={isLoading}
        />

        <SummaryCard
          index={1}
          title="Cost Findings"
          value={dashboardData.categoryStats?.costFindings}
          icon={<FaDollarSign size={22} />}
          gradient="from-amber-500 to-orange-500"
          loading={isLoading}
        />

        <SummaryCard
          index={2}
          title="Performance Findings"
          value={dashboardData.categoryStats?.performanceFindings}
          icon={<FaGaugeHigh size={22} />}
          gradient="from-indigo-500 to-purple-500"
          loading={isLoading}
        />
      </div>

      <h2 className="mt-10 mb-4 text-xl font-semibold text-slate-900 dark:text-white">EC2 Fleet Insights</h2>

      <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        <SummaryCard
          index={0}
          title="Average CPU"
          value={dashboardData.ec2Stats?.avgCpu}
          format={formatPercent}
          icon={<FaMicrochip size={20} />}
          gradient="from-blue-500 to-cyan-500"
          loading={isLoading}
        />

        <SummaryCard
          index={1}
          title="Average Network"
          value={dashboardData.ec2Stats?.avgNetwork}
          format={formatBytes}
          icon={<FaNetworkWired size={20} />}
          gradient="from-indigo-500 to-purple-500"
          loading={isLoading}
        />

        <SummaryCard
          index={2}
          title="Average Disk"
          value={dashboardData.ec2Stats?.avgDisk}
          format={formatBytes}
          icon={<FaHardDrive size={20} />}
          gradient="from-fuchsia-500 to-pink-500"
          loading={isLoading}
        />

        <SummaryCard
          index={3}
          title="Idle Instances"
          value={dashboardData.ec2Stats?.idleInstances}
          icon={<FaMoon size={20} />}
          gradient="from-slate-500 to-slate-700"
          loading={isLoading}
        />

        <SummaryCard
          index={4}
          title="Old Instances"
          value={dashboardData.ec2Stats?.oldInstances}
          icon={<FaClockRotateLeft size={20} />}
          gradient="from-amber-500 to-orange-600"
          loading={isLoading}
        />

        <SummaryCard
          index={5}
          title="Encrypted Volumes"
          value={dashboardData.ec2Stats?.encryptedVolumes}
          icon={<FaShieldHalved size={20} />}
          gradient="from-emerald-500 to-teal-500"
          loading={isLoading}
        />
      </div>

      <h2 className="mt-10 mb-4 text-xl font-semibold text-slate-900 dark:text-white">IAM Security Insights</h2>

      <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        <SummaryCard
          index={0}
          title="IAM Users"
          value={dashboardData.iamStats?.totalUsers}
          icon={<FaUser size={20} />}
          gradient="from-blue-500 to-indigo-500"
          loading={isLoading}
        />

        <SummaryCard
          index={1}
          title="IAM Roles"
          value={dashboardData.iamStats?.totalRoles}
          icon={<FaUserGroup size={20} />}
          gradient="from-indigo-500 to-purple-500"
          loading={isLoading}
        />

        <SummaryCard
          index={2}
          title="MFA Enabled"
          value={dashboardData.iamStats?.mfaEnabledUsers}
          icon={<FaKey size={20} />}
          gradient="from-emerald-500 to-teal-500"
          loading={isLoading}
        />

        <SummaryCard
          index={3}
          title="Admin Users"
          value={dashboardData.iamStats?.adminUsers}
          icon={<FaUserGear size={20} />}
          gradient="from-amber-500 to-orange-600"
          loading={isLoading}
        />

        <SummaryCard
          index={4}
          title="Old Access Keys"
          value={dashboardData.iamStats?.oldAccessKeys}
          icon={<FaClockRotateLeft size={20} />}
          gradient="from-fuchsia-500 to-pink-500"
          loading={isLoading}
        />

        <SummaryCard
          index={5}
          title="High Risk Users"
          value={dashboardData.iamStats?.highRiskUsers}
          icon={<FaTriangleExclamation size={20} />}
          gradient="from-red-500 to-rose-600"
          loading={isLoading}
        />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-2">
        <ResourceHealthPieChart severitySummary={dashboardData.severitySummary} index={0} loading={isLoading} />
        <CostBreakdownDonutChart costBreakdown={dashboardData.costBreakdown} index={1} loading={isLoading} />
        <ResourceDistributionBarChart resourceDistribution={dashboardData.resourceDistribution} index={2} loading={isLoading} />
        <SavingsOpportunityBarChart savingsOpportunities={dashboardData.savingsOpportunities} index={3} loading={isLoading} />
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
