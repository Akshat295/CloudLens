import { useState } from "react";
import {
  ignoreRecommendation,
  resolveRecommendation,
  stopRecommendation,
} from "../services/recommendation.service";
import { showSuccessToast, showErrorToast } from "../utils/toast";

// Shared ignore/resolve/stop logic, used by both RecommendationTable's row
// buttons and ResourceDetailsDrawer's footer buttons so the actual API calls
// (and their toast notifications) exist in exactly one place.
export const useRecommendationActions = (onRecommendationUpdate, refresh) => {
  const [stoppingId, setStoppingId] = useState(null);
  const [actionId, setActionId] = useState(null);

  const performAction = async (
    id,
    actionFn,
    setLoadingId,
    { successMessage, errorMessage },
    onSuccess
  ) => {
    try {
      setLoadingId(id);
      const updated = await actionFn(id);
      onRecommendationUpdate(updated);
      if (onSuccess) await onSuccess();
      showSuccessToast(successMessage);
    } catch (error) {
      console.error(errorMessage, error);
      showErrorToast(error.response?.data?.message || errorMessage);
    } finally {
      setLoadingId(null);
    }
  };

  const handleIgnore = (id) =>
    performAction(id, ignoreRecommendation, setActionId, {
      successMessage: "Recommendation ignored.",
      errorMessage: "Failed to ignore recommendation.",
    });

  const handleResolve = (id) =>
    performAction(id, resolveRecommendation, setActionId, {
      successMessage: "Recommendation resolved.",
      errorMessage: "Failed to resolve recommendation.",
    });

  const handleStop = (id) =>
    performAction(
      id,
      stopRecommendation,
      setStoppingId,
      {
        successMessage: "EC2 instance stopped successfully.",
        errorMessage: "Failed to stop EC2 instance.",
      },
      refresh
    );

  return { stoppingId, actionId, handleIgnore, handleResolve, handleStop };
};
