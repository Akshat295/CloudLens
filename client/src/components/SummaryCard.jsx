import Skeleton from "react-loading-skeleton";
import Card from "./Card";
import AnimatedCounter from "./AnimatedCounter";

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (index) => ({
    opacity: 1,
    y: 0,
    transition: { delay: index * 0.05, duration: 0.4, ease: "easeOut" },
  }),
};

const SummaryCard = ({ title, value, icon, gradient, format, index = 0, loading = false }) => {
  return (
    <Card
      hover
      custom={index}
      initial="hidden"
      animate="visible"
      variants={cardVariants}
      whileHover={loading ? undefined : { y: -6, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="group relative overflow-hidden"
    >
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-gradient-to-br opacity-20 blur-2xl transition-opacity duration-300 group-hover:opacity-30 ${gradient}`}
      />

      <div className="relative flex items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-slate-500">{title}</p>

          <h2 className="mt-2 truncate text-3xl font-bold text-slate-900">
            {loading ? (
              <Skeleton width={80} height={30} />
            ) : (
              <AnimatedCounter value={typeof value === "number" ? value : 0} format={format} />
            )}
          </h2>
        </div>

        <div
          className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg ${gradient}`}
        >
          {icon}
        </div>
      </div>
    </Card>
  );
};

export default SummaryCard;
