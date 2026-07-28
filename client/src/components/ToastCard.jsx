import toast from "react-hot-toast";
import { FaBolt, FaCircleCheck, FaCircleExclamation, FaXmark } from "react-icons/fa6";

const VARIANTS = {
  success: {
    icon: FaCircleCheck,
    iconClass: "text-emerald-500",
    borderClass: "border-emerald-200 dark:border-emerald-500/30",
  },
  error: {
    icon: FaCircleExclamation,
    iconClass: "text-red-500",
    borderClass: "border-red-200 dark:border-red-500/30",
  },
  info: {
    icon: FaBolt,
    iconClass: "text-blue-500",
    borderClass: "border-slate-100 dark:border-white/10",
  },
};

const ToastCard = ({ t, variant, message }) => {
  const style = VARIANTS[variant] || VARIANTS.info;
  const Icon = style.icon;

  return (
    <div
      className={`${t.visible ? "opacity-100" : "opacity-0"} pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border bg-white p-4 shadow-xl transition-opacity duration-200 dark:bg-slate-800 ${style.borderClass}`}
    >
      <Icon className={`mt-0.5 shrink-0 text-lg ${style.iconClass}`} />
      <p className="flex-1 text-sm font-medium text-slate-700 dark:text-slate-200">{message}</p>
      <button
        type="button"
        onClick={() => toast.dismiss(t.id)}
        className="shrink-0 text-slate-400 transition hover:text-slate-600 dark:hover:text-slate-200"
        aria-label="Dismiss notification"
      >
        <FaXmark size={14} />
      </button>
    </div>
  );
};

export default ToastCard;
