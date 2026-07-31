import Skeleton from "react-loading-skeleton";
import { FaServer, FaBucket, FaDatabase, FaUserShield, FaCloud } from "react-icons/fa6";
import Card from "./Card";
import { formatCurrency } from "../utils/format";

// Per-service display polish for the services this app currently knows
// about — purely cosmetic (icon/label/gradient). Any resourceType prefix
// not listed here (a future Lambda, EBS, CloudFront, DynamoDB scanner, ...)
// still renders a correct card via DEFAULT_META, so a new service needs no
// change here to show up.
const SERVICE_META = {
  EC2: { icon: FaServer, resourceLabel: "Resources", gradient: "from-blue-500 to-indigo-500" },
  S3: { icon: FaBucket, resourceLabel: "Buckets", gradient: "from-emerald-500 to-teal-500" },
  RDS: { icon: FaDatabase, resourceLabel: "Instances", gradient: "from-indigo-500 to-purple-500" },
  IAM: { icon: FaUserShield, resourceLabel: "Users/Roles", gradient: "from-amber-500 to-orange-500" },
};

const DEFAULT_META = { icon: FaCloud, resourceLabel: "Resources", gradient: "from-slate-500 to-slate-700" };

const getServiceMeta = (service) => SERVICE_META[service] || DEFAULT_META;

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (index) => ({
    opacity: 1,
    y: 0,
    transition: { delay: index * 0.05, duration: 0.4, ease: "easeOut" },
  }),
};

const ServiceOverviewGrid = ({ services = [], loading = false }) => {
  if (loading) {
    return (
      <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index} padding="p-5">
            <Skeleton height={16} width="40%" />
            <Skeleton height={14} width="70%" style={{ marginTop: 14 }} />
            <Skeleton height={14} width="70%" style={{ marginTop: 8 }} />
          </Card>
        ))}
      </div>
    );
  }

  if (!services.length) {
    return (
      <Card padding="p-8" className="text-center text-sm text-slate-500">
        No scanned resources yet. Run a scan to see resources by service.
      </Card>
    );
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {services.map((entry, index) => {
        const meta = getServiceMeta(entry.service);
        const Icon = meta.icon;

        return (
          <Card
            key={entry.service}
            hover
            custom={index}
            initial="hidden"
            animate="visible"
            variants={cardVariants}
            whileHover={{ y: -6, scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            padding="p-5"
            className="relative overflow-hidden"
          >
            <div
              aria-hidden="true"
              className={`pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-gradient-to-br opacity-20 blur-2xl ${meta.gradient}`}
            />

            <div className="relative flex items-center gap-3">
              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-lg ${meta.gradient}`}
              >
                <Icon size={18} />
              </div>
              <h3 className="text-lg font-bold text-slate-900">{entry.service}</h3>
            </div>

            <dl className="relative mt-4 space-y-1.5 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-slate-500">{meta.resourceLabel}</dt>
                <dd className="font-semibold text-slate-900">{entry.resourceCount}</dd>
              </div>

              <div className="flex items-center justify-between">
                <dt className="text-slate-500">Recommendations</dt>
                <dd className="font-semibold text-slate-900">{entry.recommendationCount}</dd>
              </div>

              {entry.estimatedSavings > 0 && (
                <div className="flex items-center justify-between">
                  <dt className="text-slate-500">Savings</dt>
                  <dd className="font-semibold text-emerald-600">{formatCurrency(entry.estimatedSavings)}</dd>
                </div>
              )}
            </dl>
          </Card>
        );
      })}
    </div>
  );
};

export default ServiceOverviewGrid;
