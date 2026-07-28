import { FaSort, FaSortUp, FaSortDown } from "react-icons/fa6";

// Shared sortable-column indicator: neutral glyph when inactive, up/down
// arrow when this column is the active sort key.
const SortIcon = ({ active, direction }) => {
  if (!active) return <FaSort className="text-slate-300" size={11} />;
  return direction === "asc" ? <FaSortUp size={11} /> : <FaSortDown size={11} />;
};

export default SortIcon;
