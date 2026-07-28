import { FaFilter } from "react-icons/fa6";

// Shared table-toolbar dropdown (label + native select + filter icon), used
// by every filterable table (RecommendationTable, ScanHistory, ...).
const FilterSelect = ({ label, value, onChange, options }) => (
  <div className="relative">
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      aria-label={label}
      className="appearance-none rounded-xl border border-slate-200 bg-white/80 py-2.5 pl-3 pr-8 text-sm font-medium text-slate-600 transition focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
    <FaFilter className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={11} />
  </div>
);

export default FilterSelect;
