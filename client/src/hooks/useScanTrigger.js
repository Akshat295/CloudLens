import { useRef, useState } from "react";
import { scanInfrastructure } from "../services/dashboard.service";
import { SCAN_STEPS } from "../constants/scanSteps";
import { showSuccessToast, showErrorToast, showInfoToast } from "../utils/toast";

const STEP_INTERVAL_MS = 900;
const COMPLETE_HOLD_MS = 800;
const ERROR_HOLD_MS = 1500;
// Auto-advance stops one step short of the last ("Save Database") — that step
// only completes once the real scan request actually resolves, so the UI
// never claims the scan is done before it is.
const MAX_AUTO_STEP = SCAN_STEPS.length - 2;

const wait = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));

// Drives the "Run Scan" button now that it lives in the global Navbar
// (reachable from every page) instead of being local to the Dashboard.
// `onSuccess` lets each page refetch its own data once the scan completes.
export const useScanTrigger = (onSuccess) => {
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [scanPhase, setScanPhase] = useState("idle");
  const timerRef = useRef(null);

  const runScan = async () => {
    setScanning(true);
    setScanError(null);
    setScanPhase("running");
    setStepIndex(0);
    showInfoToast("Infrastructure scan started.");

    timerRef.current = window.setInterval(() => {
      setStepIndex((prev) => (prev < MAX_AUTO_STEP ? prev + 1 : prev));
    }, STEP_INTERVAL_MS);

    try {
      await scanInfrastructure();
      window.clearInterval(timerRef.current);
      setStepIndex(SCAN_STEPS.length - 1);
      setScanPhase("success");

      if (onSuccess) await onSuccess();

      showSuccessToast("Infrastructure scan completed successfully.");
      await wait(COMPLETE_HOLD_MS);
    } catch (error) {
      window.clearInterval(timerRef.current);
      console.error("Scan failed:", error);

      const message = "Scan failed. Check backend logs and AWS credentials.";
      setScanError(message);
      setScanPhase("error");
      showErrorToast(message);
      await wait(ERROR_HOLD_MS);
    } finally {
      setScanning(false);
      setScanPhase("idle");
    }
  };

  return { scanning, scanError, runScan, stepIndex, scanPhase };
};
