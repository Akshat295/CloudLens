import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import Skeleton from "react-loading-skeleton";
import Navbar from "../components/Navbar";
import PageTransition from "../components/PageTransition";
import Card from "../components/Card";
import ErrorBanner from "../components/ErrorBanner";
import RecommendationTable from "../components/RecommendationTable";
import ResourceTable from "../components/ResourceTable";
import { getScanById } from "../services/scan.service";
import { useAsyncData } from "../hooks/useAsyncData";
import { useScanTrigger } from "../hooks/useScanTrigger";
import { formatScanTime, formatCurrency } from "../utils/format";
import { getScanStatusBadgeClass } from "../utils/badge";

const statCardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (index) => ({
    opacity: 1,
    y: 0,
    transition: { delay: index * 0.06, duration: 0.4, ease: "easeOut" },
  }),
};

const ScanDetail = () => {
  const { scanId } = useParams();

  const {
    data: scanData,
    setData: setScanData,
    loading,
    error,
    refetch,
  } = useAsyncData(() => getScanById(scanId), [scanId], {
    errorMessage: "Failed to load scan details.",
  });

  const { scanning, scanError, runScan, stepIndex, scanPhase } = useScanTrigger(refetch);

  const handleRecommendationUpdate = (updated) => {
    setScanData((prev) => ({
      ...prev,
      recommendations: prev.recommendations.map((rec) =>
        rec._id === updated._id ? { ...rec, ...updated } : rec
      ),
    }));
  };

  if (!loading && (error || !scanData)) {
    return (
      <PageTransition className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 p-4 dark:from-slate-950 dark:to-slate-900 sm:p-6 lg:p-8">
        <Navbar onScan={runScan} scanning={scanning} stepIndex={stepIndex} scanPhase={scanPhase} />
        <ErrorBanner message={error || "Scan not found."} className="mt-6" />
        <Link
          to="/scan-history"
          className="mt-4 inline-block text-blue-600 hover:underline"
        >
          Back to Scan History
        </Link>
      </PageTransition>
    );
  }

  const isLoading = loading || !scanData;
  const { scan, resources = [], recommendations = [] } = scanData || {};

  return (
    <PageTransition className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 p-4 dark:from-slate-950 dark:to-slate-900 sm:p-6 lg:p-8">
      <Navbar onScan={runScan} scanning={scanning} />

      <ErrorBanner message={scanError} className="mt-6" />

      <Link
        to="/scan-history"
        className="mt-6 inline-block text-sm text-blue-600 hover:underline"
      >
        ← Back to Scan History
      </Link>

      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="mt-4 flex flex-wrap items-center justify-between gap-4"
      >
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Scan Details</h2>
          <p className="mt-1 text-slate-500 dark:text-slate-400">
            {isLoading ? <Skeleton width={140} height={14} /> : formatScanTime(scan)}
          </p>
        </div>

        {isLoading ? (
          <Skeleton width={90} height={30} borderRadius="9999px" />
        ) : (
          <span
            className={`rounded-full px-4 py-1.5 text-sm font-semibold ${getScanStatusBadgeClass(scan.status)}`}
          >
            {scan.status}
          </span>
        )}
      </motion.div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Card
          hover
          padding="p-5"
          custom={0}
          initial="hidden"
          animate="visible"
          variants={statCardVariants}
          whileHover={{ y: -4, scale: 1.01 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          <p className="text-sm text-slate-500">Resources</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            {isLoading ? <Skeleton width={50} height={24} /> : (scan.totalResources ?? resources.length)}
          </p>
        </Card>

        <Card
          hover
          padding="p-5"
          custom={1}
          initial="hidden"
          animate="visible"
          variants={statCardVariants}
          whileHover={{ y: -4, scale: 1.01 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          <p className="text-sm text-slate-500">Estimated Savings</p>
          <p className="mt-1 text-2xl font-bold text-emerald-600">
            {isLoading ? <Skeleton width={70} height={24} /> : formatCurrency(scan.estimatedSavings)}
          </p>
        </Card>
      </div>

      <Card
        className="mt-10"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4, ease: "easeOut" }}
      >
        <h3 className="mb-4 text-xl font-semibold text-slate-900">Resources</h3>
        <ResourceTable resources={resources} loading={isLoading} />
      </Card>

      <RecommendationTable
        recommendations={recommendations}
        onRecommendationUpdate={handleRecommendationUpdate}
        refresh={refetch}
        loading={isLoading}
      />
    </PageTransition>
  );
};

export default ScanDetail;
