import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FaCloud,
  FaGlobe,
  FaKey,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaTag,
  FaPlug,
  FaFloppyDisk,
  FaSpinner,
  FaCircleCheck,
} from "react-icons/fa6";

import PageTransition from "../components/PageTransition";
import ErrorBanner from "../components/ErrorBanner";
import { testAwsConnection, connectAwsAccount } from "../services/awsConnection.service";

const REGION_OPTIONS = [
  { value: "ap-south-1", label: "Asia Pacific (Mumbai)" },
  { value: "us-east-1", label: "US East (N. Virginia)" },
  { value: "ap-southeast-1", label: "Asia Pacific (Singapore)" },
  { value: "ap-northeast-1", label: "Asia Pacific (Tokyo)" },
];

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-300 dark:border-white/10 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500";

const labelClass = "mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300";

// Fields whose credentials a passing test result is scoped to — changing any
// of them invalidates the previous test, since Save & Connect must only be
// enabled for credentials that were actually verified.
const CREDENTIAL_FIELDS = ["region", "accessKeyId", "secretAccessKey"];

const ConnectAws = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    region: REGION_OPTIONS[0].value,
    accessKeyId: "",
    secretAccessKey: "",
    accountAlias: "",
  });
  const [showSecret, setShowSecret] = useState(false);
  const [error, setError] = useState(null);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [saving, setSaving] = useState(false);

  const handleChange = (field) => (event) => {
    const { value } = event.target;

    setFormData((prev) => ({ ...prev, [field]: value }));

    if (CREDENTIAL_FIELDS.includes(field)) {
      setTestResult(null);
    }
  };

  const handleTestConnection = async () => {
    setError(null);
    setTesting(true);

    try {
      const result = await testAwsConnection(formData);
      setTestResult(result);
    } catch (err) {
      setTestResult(null);
      setError(err.response?.data?.message || "Failed to connect to AWS with these credentials");
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async (event) => {
    event.preventDefault();
    if (!testResult) return;

    setError(null);
    setSaving(true);

    try {
      await connectAwsAccount(formData);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to connect AWS account");
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageTransition className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 p-4 dark:from-slate-950 dark:to-slate-900">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="w-full max-w-lg rounded-2xl border border-white/60 bg-white/80 p-8 shadow-xl shadow-slate-200/50 backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/70 dark:shadow-black/30"
      >
        <div className="mb-8 flex flex-col items-center text-center">
          <FaCloud className="text-4xl text-blue-600 dark:text-blue-400" />
          <h1 className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">Connect AWS</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Link an AWS account to start scanning its resources
          </p>
        </div>

        <ErrorBanner message={error} className="mb-4" />

        {testResult && (
          <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400">
            <p className="flex items-center gap-1.5 font-semibold">
              <FaCircleCheck size={14} /> Connected Successfully
            </p>
            <dl className="mt-2 space-y-1 text-emerald-700/90 dark:text-emerald-400/90">
              <div className="flex gap-1.5">
                <dt className="font-medium">AWS Account ID:</dt>
                <dd className="font-mono">{testResult.accountId}</dd>
              </div>
              <div className="flex gap-1.5">
                <dt className="font-medium">Region:</dt>
                <dd>{testResult.region}</dd>
              </div>
              <div className="flex gap-1.5 break-all">
                <dt className="shrink-0 font-medium">ARN:</dt>
                <dd className="font-mono">{testResult.arn}</dd>
              </div>
            </dl>
          </div>
        )}

        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <div>
            <label htmlFor="region" className={labelClass}>
              AWS Region
            </label>
            <div className="relative">
              <FaGlobe
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                size={14}
              />
              <select
                id="region"
                value={formData.region}
                onChange={handleChange("region")}
                className={`${inputClass} appearance-none`}
              >
                {REGION_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label} ({option.value})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="accessKeyId" className={labelClass}>
              Access Key ID
            </label>
            <div className="relative">
              <FaKey
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                size={14}
              />
              <input
                id="accessKeyId"
                type="text"
                required
                autoComplete="off"
                spellCheck={false}
                value={formData.accessKeyId}
                onChange={handleChange("accessKeyId")}
                placeholder="AKIAXXXXXXXXXXXXXXXX"
                className={`${inputClass} font-mono`}
              />
            </div>
          </div>

          <div>
            <label htmlFor="secretAccessKey" className={labelClass}>
              Secret Access Key
            </label>
            <div className="relative">
              <FaLock
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                size={14}
              />
              <input
                id="secretAccessKey"
                type={showSecret ? "text" : "password"}
                required
                autoComplete="off"
                spellCheck={false}
                value={formData.secretAccessKey}
                onChange={handleChange("secretAccessKey")}
                placeholder="••••••••••••••••••••••••••••••••••••••••"
                className={`${inputClass} pr-10 font-mono`}
              />
              <button
                type="button"
                onClick={() => setShowSecret((prev) => !prev)}
                aria-label={showSecret ? "Hide secret access key" : "Show secret access key"}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600 dark:hover:text-slate-300"
              >
                {showSecret ? <FaEyeSlash size={14} /> : <FaEye size={14} />}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="accountAlias" className={labelClass}>
              Friendly Account Name <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <div className="relative">
              <FaTag
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                size={14}
              />
              <input
                id="accountAlias"
                type="text"
                value={formData.accountAlias}
                onChange={handleChange("accountAlias")}
                placeholder="Production Account"
                className={inputClass}
              />
            </div>
          </div>

          <div className="mt-2 flex flex-col gap-3 sm:flex-row">
            <motion.button
              type="button"
              onClick={handleTestConnection}
              disabled={testing || !formData.accessKeyId || !formData.secretAccessKey}
              whileHover={testing ? undefined : { scale: 1.02 }}
              whileTap={testing ? undefined : { scale: 0.98 }}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 dark:border-white/10 dark:bg-slate-800 dark:text-slate-200"
            >
              {testing ? <FaSpinner className="animate-spin" size={14} /> : <FaPlug size={14} />}
              {testing ? "Testing..." : "Test Connection"}
            </motion.button>

            <motion.button
              type="submit"
              disabled={!testResult || saving}
              whileHover={!testResult || saving ? undefined : { scale: 1.02 }}
              whileTap={!testResult || saving ? undefined : { scale: 0.98 }}
              title={!testResult ? "Test the connection successfully before saving" : undefined}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-500/20 transition disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
            >
              {saving ? <FaSpinner className="animate-spin" size={14} /> : <FaFloppyDisk size={14} />}
              {saving ? "Saving..." : "Save & Connect"}
            </motion.button>
          </div>
        </form>
      </motion.div>
    </PageTransition>
  );
};

export default ConnectAws;
