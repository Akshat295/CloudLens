import Navbar from "../components/Navbar";
import PageTransition from "../components/PageTransition";
import ErrorBanner from "../components/ErrorBanner";
import RecommendationTable from "../components/RecommendationTable";
import { getRecommendations } from "../services/recommendation.service";
import { useAsyncData } from "../hooks/useAsyncData";
import { useScanTrigger } from "../hooks/useScanTrigger";

const Recommendations = () => {
  const {
    data: recommendations,
    setData,
    loading,
    error,
    refetch,
  } = useAsyncData(getRecommendations, [], {
    initialValue: [],
    errorMessage: "Failed to load recommendations.",
  });

  const { scanning, scanError, runScan, stepIndex, scanPhase } = useScanTrigger(refetch);

  const handleRecommendationUpdate = (updated) => {
    setData((prev) => prev.map((rec) => (rec._id === updated._id ? updated : rec)));
  };

  return (
    <PageTransition className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 p-4 dark:from-slate-950 dark:to-slate-900 sm:p-6 lg:p-8">
      <Navbar onScan={runScan} scanning={scanning} stepIndex={stepIndex} scanPhase={scanPhase} />

      <div className="mt-6">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Recommendations</h2>
        <p className="mt-1 text-slate-500 dark:text-slate-400">
          All cost and configuration recommendations from your latest scan.
        </p>
      </div>

      <ErrorBanner message={error || scanError} className="mt-6" />

      <RecommendationTable
        recommendations={recommendations}
        onRecommendationUpdate={handleRecommendationUpdate}
        refresh={refetch}
        loading={loading}
      />
    </PageTransition>
  );
};

export default Recommendations;
