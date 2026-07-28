// Shared inline error banner used by every page. Takes the truthy-check
// (`{error && <div>...</div>}`) that every call site used to repeat, and adds
// proper dark-mode colors (previously missing everywhere) to match the
// red variant already established by ToastCard.
const ErrorBanner = ({ message, className = "" }) => {
  if (!message) return null;

  return (
    <div
      role="alert"
      className={`rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400 ${className}`}
    >
      {message}
    </div>
  );
};

export default ErrorBanner;
