import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  FaBell,
  FaEnvelope,
  FaFloppyDisk,
  FaSpinner,
  FaTriangleExclamation,
  FaChartLine,
} from "react-icons/fa6";

import Navbar from "../components/Navbar";
import PageTransition from "../components/PageTransition";
import Card from "../components/Card";
import ErrorBanner from "../components/ErrorBanner";
import ToggleSwitch from "../components/ToggleSwitch";
import { useAsyncData } from "../hooks/useAsyncData";
import { useScanTrigger } from "../hooks/useScanTrigger";
import { getNotificationSettings, updateNotificationSettings } from "../services/notification.service";
import { showSuccessToast, showErrorToast } from "../utils/toast";

const focusRingClass = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300";

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 shadow-sm transition focus:outline-none focus:ring-2 focus:ring-blue-300 dark:border-white/10 dark:bg-slate-800 dark:text-white";

const labelClass = "mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300";

const NOTIFICATION_OPTIONS = [
  {
    key: "scanCompleted",
    icon: FaChartLine,
    title: "Scan Completed",
    description: "Get an email summary every time a scheduled scan finishes.",
  },
  {
    key: "highSeverity",
    icon: FaTriangleExclamation,
    title: "High Severity Recommendation",
    description: "Get notified immediately when a scan finds a high-severity issue.",
  },
  {
    key: "weeklyReport",
    icon: FaEnvelope,
    title: "Weekly Cost Report",
    description: "Receive a weekly summary of your resources, cost, and savings.",
  },
];

const NotificationSettings = () => {
  const { data: settings, setData, loading, error } = useAsyncData(getNotificationSettings, [], {
    errorMessage: "Failed to load notification settings.",
  });

  const { scanning, scanError, runScan, stepIndex, scanPhase } = useScanTrigger();

  const [email, setEmail] = useState("");
  const [savingEmail, setSavingEmail] = useState(false);
  const [togglingKey, setTogglingKey] = useState(null);

  useEffect(() => {
    if (settings) setEmail(settings.email);
  }, [settings]);

  const handleToggle = async (key) => {
    if (!settings) return;

    setTogglingKey(key);

    try {
      const updated = await updateNotificationSettings({ [key]: !settings[key] });
      setData(updated);
    } catch (err) {
      showErrorToast(err.response?.data?.message || "Failed to update notification setting.");
    } finally {
      setTogglingKey(null);
    }
  };

  const handleSaveEmail = async () => {
    if (!settings || email === settings.email) return;

    setSavingEmail(true);

    try {
      const updated = await updateNotificationSettings({ email });
      setData(updated);
      showSuccessToast("Notification email updated.");
    } catch (err) {
      showErrorToast(err.response?.data?.message || "Failed to update notification email.");
    } finally {
      setSavingEmail(false);
    }
  };

  return (
    <PageTransition className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 p-4 dark:from-slate-950 dark:to-slate-900 sm:p-6 lg:p-8">
      <Navbar onScan={runScan} scanning={scanning} stepIndex={stepIndex} scanPhase={scanPhase} />

      <div className="mt-6">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Notification Settings</h2>
        <p className="mt-1 text-slate-500 dark:text-slate-400">
          Choose what CloudLens emails you about.
        </p>
      </div>

      <ErrorBanner message={error || scanError} className="mt-6" />

      <Card className="mt-8 max-w-xl">
        {loading || !settings ? (
          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <FaSpinner className="animate-spin" size={14} /> Loading settings...
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 text-slate-900 dark:text-white">
              <FaBell className="text-blue-600 dark:text-blue-400" size={18} />
              <h3 className="text-lg font-semibold">Email Notifications</h3>
            </div>

            <div className="mt-5">
              <label htmlFor="notif-email" className={labelClass}>
                Notification Email
              </label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <div className="relative flex-1">
                  <FaEnvelope
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    size={14}
                  />
                  <input
                    id="notif-email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                    className={inputClass}
                  />
                </div>

                <motion.button
                  type="button"
                  onClick={handleSaveEmail}
                  disabled={savingEmail || email === settings.email}
                  whileHover={savingEmail || email === settings.email ? undefined : { scale: 1.02 }}
                  whileTap={savingEmail || email === settings.email ? undefined : { scale: 0.98 }}
                  className={`flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-slate-800 dark:text-slate-200 ${focusRingClass}`}
                >
                  {savingEmail ? <FaSpinner className="animate-spin" size={14} /> : <FaFloppyDisk size={14} />}
                  {savingEmail ? "Saving..." : "Save"}
                </motion.button>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3">
              {NOTIFICATION_OPTIONS.map(({ key, icon: Icon, title, description }) => (
                <div
                  key={key}
                  className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-4 py-3 dark:border-white/10"
                >
                  <div className="flex items-start gap-3">
                    <Icon className="mt-0.5 text-blue-600 dark:text-blue-400" size={16} />
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">{title}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{description}</p>
                    </div>
                  </div>

                  <ToggleSwitch
                    checked={settings[key]}
                    onChange={() => handleToggle(key)}
                    disabled={togglingKey === key}
                    label={`Toggle ${title}`}
                  />
                </div>
              ))}
            </div>
          </>
        )}
      </Card>
    </PageTransition>
  );
};

export default NotificationSettings;
