import Card from "./Card";

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (index) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.15 + index * 0.08, duration: 0.5, ease: "easeOut" },
  }),
};

// Staggered entrance for every dashboard chart, so each chart component only
// has to define its own Recharts content. Hover uses its own quick spring
// (via the top-level `transition` prop) so it doesn't inherit the entrance
// variant's delay.
const ChartCard = ({ title, subtitle, index = 0, children }) => {
  return (
    <Card
      hover
      custom={index}
      initial="hidden"
      animate="visible"
      variants={cardVariants}
      whileHover={{ y: -4, scale: 1.005 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>

      {children}
    </Card>
  );
};

export default ChartCard;
