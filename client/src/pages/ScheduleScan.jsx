import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  FaClock,
  FaCalendarCheck,
  FaCalendarDays,
  FaFloppyDisk,
  FaSpinner,
  FaTrash,
  FaPlus,
} from "react-icons/fa6";

import Navbar from "../components/Navbar";
import PageTransition from "../components/PageTransition";
import Card from "../components/Card";
import ErrorBanner from "../components/ErrorBanner";
import Badge from "../components/Badge";
import ToggleSwitch from "../components/ToggleSwitch";
import { useAsyncData } from "../hooks/useAsyncData";
import { useScanTrigger } from "../hooks/useScanTrigger";
import { getSchedule, createSchedule, updateSchedule, deleteSchedule } from "../services/schedule.service";
import { formatDateTime } from "../utils/format";
import { getScheduleStatusBadgeStyle } from "../utils/badge";
import { showSuccessToast, showErrorToast } from "../utils/toast";

const FREQUENCY_OPTIONS = [
  { value: "hourly", label: "Hourly" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
];

const focusRingClass = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300";

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 shadow-sm transition focus:outline-none focus:ring-2 focus:ring-blue-300 dark:border-white/10 dark:bg-slate-800 dark:text-white";

const labelClass = "mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300";

const ScheduleScan = () => {
  const { data: schedule, setData, loading, error } = useAsyncData(getSchedule, [], {
    errorMessage: "Failed to load scan schedule.",
  });

  const { scanning, scanError, runScan, stepIndex, scanPhase } = useScanTrigger();

  const [frequency, setFrequency] = useState(FREQUENCY_OPTIONS[1].value);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (schedule) setFrequency(schedule.frequency);
  }, [schedule]);

  const handleCreate = async () => {
    setCreating(true);

    try {
      const created = await createSchedule({ frequency, enabled: true });
      setData(created);
      showSuccessToast("Scan schedule created.");
    } catch (err) {
      showErrorToast(err.response?.data?.message || "Failed to create schedule.");
    } finally {
      setCreating(false);
    }
  };

  const handleSaveFrequency = async () => {
    if (!schedule || frequency === schedule.frequency) return;

    setSaving(true);

    try {
      const updated = await updateSchedule(schedule._id, { frequency });
      setData(updated);
      showSuccessToast("Schedule frequency updated.");
    } catch (err) {
      showErrorToast(err.response?.data?.message || "Failed to update schedule.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleEnabled = async () => {
    if (!schedule) return;

    setToggling(true);

    try {
      const updated = await updateSchedule(schedule._id, { enabled: !schedule.enabled });
      setData(updated);
      showSuccessToast(updated.enabled ? "Schedule enabled." : "Schedule disabled.");
    } catch (err) {
      showErrorToast(err.response?.data?.message || "Failed to update schedule.");
    } finally {
      setToggling(false);
    }
  };

  const handleDelete = async () => {
    if (!schedule) return;

    setDeleting(true);

    try {
      await deleteSchedule(schedule._id);
      setData(null);
      showSuccessToast("Schedule deleted.");
    } catch (err) {
      showErrorToast(err.response?.data?.message || "Failed to delete schedule.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <PageTransition className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 p-4 dark:from-slate-950 dark:to-slate-900 sm:p-6 lg:p-8">
      <Navbar onScan={runScan} scanning={scanning} stepIndex={stepIndex} scanPhase={scanPhase} />

      <div className="mt-6">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Scheduled Scans</h2>
        <p className="mt-1 text-slate-500 dark:text-slate-400">
          Automatically run infrastructure scans on a recurring schedule.
        </p>
      </div>

      <ErrorBanner message={error || scanError} className="mt-6" />

      <Card className="mt-8 max-w-xl">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <FaSpinner className="animate-spin" size={14} /> Loading schedule...
          </div>
        ) : !schedule ? (
          <>
            <div className="flex items-center gap-2 text-slate-900 dark:text-white">
              <FaClock className="text-blue-600 dark:text-blue-400" size={18} />
              <h3 className="text-lg font-semibold">No schedule set up yet</h3>
            </div>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Pick how often CloudLens should automatically scan your connected AWS account.
            </p>

            <div className="mt-5">
              <label htmlFor="frequency" className={labelClass}>
                Frequency
              </label>
              <div className="relative">
                <FaCalendarDays
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  size={14}
                />
                <select
                  id="frequency"
                  value={frequency}
                  onChange={(event) => setFrequency(event.target.value)}
                  className={`${inputClass} appearance-none`}
                >
                  {FREQUENCY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <motion.button
              type="button"
              onClick={handleCreate}
              disabled={creating}
              whileHover={creating ? undefined : { scale: 1.02 }}
              whileTap={creating ? undefined : { scale: 0.98 }}
              className={`mt-5 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-500/20 transition disabled:cursor-not-allowed disabled:opacity-60 ${focusRingClass}`}
            >
              {creating ? <FaSpinner className="animate-spin" size={14} /> : <FaPlus size={14} />}
              {creating ? "Creating..." : "Create Schedule"}
            </motion.button>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-slate-900 dark:text-white">
                <FaClock className="text-blue-600 dark:text-blue-400" size={18} />
                <h3 className="text-lg font-semibold">Automatic Scans</h3>
              </div>
              <Badge {...getScheduleStatusBadgeStyle(schedule.enabled)}>
                {schedule.enabled ? "Enabled" : "Disabled"}
              </Badge>
            </div>

            <div className="mt-5 flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-4 py-3 dark:border-white/10">
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-white">Enable schedule</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {schedule.enabled ? "Scans will run automatically." : "Automatic scans are paused."}
                </p>
              </div>

              <ToggleSwitch
                checked={schedule.enabled}
                onChange={handleToggleEnabled}
                disabled={toggling}
                label={schedule.enabled ? "Disable schedule" : "Enable schedule"}
              />
            </div>

            <div className="mt-4">
              <label htmlFor="frequency" className={labelClass}>
                Frequency
              </label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <div className="relative flex-1">
                  <FaCalendarDays
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    size={14}
                  />
                  <select
                    id="frequency"
                    value={frequency}
                    onChange={(event) => setFrequency(event.target.value)}
                    className={`${inputClass} appearance-none`}
                  >
                    {FREQUENCY_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <motion.button
                  type="button"
                  onClick={handleSaveFrequency}
                  disabled={saving || frequency === schedule.frequency}
                  whileHover={saving || frequency === schedule.frequency ? undefined : { scale: 1.02 }}
                  whileTap={saving || frequency === schedule.frequency ? undefined : { scale: 0.98 }}
                  className={`flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-slate-800 dark:text-slate-200 ${focusRingClass}`}
                >
                  {saving ? <FaSpinner className="animate-spin" size={14} /> : <FaFloppyDisk size={14} />}
                  {saving ? "Saving..." : "Save"}
                </motion.button>
              </div>
            </div>

            <dl className="mt-5 grid grid-cols-2 gap-4 rounded-xl border border-slate-200 px-4 py-3 text-sm dark:border-white/10">
              <div>
                <dt className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-slate-400">
                  <FaCalendarCheck size={11} /> Last Run
                </dt>
                <dd className="mt-1 font-medium text-slate-900 dark:text-white">
                  {formatDateTime(schedule.lastRun)}
                </dd>
              </div>
              <div>
                <dt className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-slate-400">
                  <FaClock size={11} /> Next Run
                </dt>
                <dd className="mt-1 font-medium text-slate-900 dark:text-white">
                  {formatDateTime(schedule.nextRun)}
                </dd>
              </div>
            </dl>

            <motion.button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              whileHover={deleting ? undefined : { scale: 1.02 }}
              whileTap={deleting ? undefined : { scale: 0.98 }}
              className={`mt-5 flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 shadow-sm transition disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-500/30 dark:bg-slate-800 dark:text-red-400 ${focusRingClass}`}
            >
              {deleting ? <FaSpinner className="animate-spin" size={14} /> : <FaTrash size={14} />}
              {deleting ? "Deleting..." : "Delete Schedule"}
            </motion.button>
          </>
        )}
      </Card>
    </PageTransition>
  );
};

export default ScheduleScan;
