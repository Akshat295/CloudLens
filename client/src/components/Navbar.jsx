import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  FaCloud,
  FaBolt,
  FaBell,
  FaCircleUser,
  FaMoon,
  FaSun,
  FaBars,
  FaXmark,
  FaGear,
  FaArrowRightFromBracket,
} from "react-icons/fa6";
import { useTheme } from "../hooks/useTheme";
import { useClickOutside } from "../hooks/useClickOutside";
import IconButton from "./IconButton";
import ScanProgressModal from "./ScanProgressModal";

const NAV_LINKS = [
  { to: "/", label: "Dashboard" },
  { to: "/scan-history", label: "Scan History" },
  { to: "/recommendations", label: "Recommendations" },
];

// motion.create wraps react-router's Link so nav items can use whileHover /
// whileTap directly on the anchor instead of an extra wrapper element.
const MotionLink = motion.create(Link);

const isPathActive = (pathname, to) =>
  to === "/" ? pathname === "/" : pathname.startsWith(to);

const focusRingClass = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300";

const dropdownPanelClass =
  "absolute right-0 top-full z-10 mt-2 w-64 overflow-hidden rounded-xl border border-slate-100 bg-white shadow-xl dark:border-white/10 dark:bg-slate-800";

const dropdownItemClass = `flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10 ${focusRingClass}`;

const dropdownMotionProps = {
  initial: { opacity: 0, y: -8, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -8, scale: 0.98 },
  transition: { duration: 0.15 },
};

const Navbar = ({ onScan, scanning, stepIndex = 0, scanPhase = "idle" }) => {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [avatarOpen, setAvatarOpen] = useState(false);

  const notifRef = useRef(null);
  const avatarRef = useRef(null);

  useClickOutside(notifRef, () => setNotifOpen(false));
  useClickOutside(avatarRef, () => setAvatarOpen(false));

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const navLinkClass = (to, mobile = false) =>
    `rounded-lg px-4 py-2 text-sm font-semibold transition ${mobile ? "block" : ""} ${focusRingClass} ${
      isPathActive(location.pathname, to)
        ? "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300"
        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
    }`;

  const runScanButton = (className) => (
    <motion.button
      type="button"
      onClick={onScan}
      disabled={scanning}
      whileHover={scanning ? undefined : { scale: 1.03 }}
      whileTap={scanning ? undefined : { scale: 0.97 }}
      className={`flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-500/20 transition disabled:cursor-not-allowed disabled:opacity-60 ${focusRingClass} ${className}`}
    >
      <motion.span
        animate={scanning ? { rotate: 360 } : { rotate: 0 }}
        transition={scanning ? { repeat: Infinity, duration: 1, ease: "linear" } : {}}
      >
        <FaBolt size={14} />
      </motion.span>
      {scanning ? "Scanning..." : "Run Scan"}
    </motion.button>
  );

  return (
    <motion.nav
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="sticky top-4 z-30 rounded-2xl border border-white/60 bg-white/80 px-4 py-3 shadow-md shadow-slate-200/50 backdrop-blur-xl transition-colors dark:border-white/10 dark:bg-slate-900/70 dark:shadow-black/30 sm:px-6 sm:py-4"
    >
      <div className="flex items-center justify-between gap-3">
        <MotionLink
          to="/"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={`flex shrink-0 items-center gap-3 rounded-lg ${focusRingClass}`}
        >
          <FaCloud className="text-3xl text-blue-600 dark:text-blue-400" />
          <div className="hidden sm:block">
            <h1 className="text-xl font-bold leading-tight text-slate-900 dark:text-white">
              CloudLens
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              AWS Cost Optimization Dashboard
            </p>
          </div>
        </MotionLink>

        <div className="hidden items-center gap-1 lg:flex">
          {NAV_LINKS.map((link) => (
            <MotionLink
              key={link.to}
              to={link.to}
              aria-current={isPathActive(location.pathname, link.to) ? "page" : undefined}
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.96 }}
              className={navLinkClass(link.to)}
            >
              {link.label}
            </MotionLink>
          ))}
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <IconButton onClick={toggleTheme} ariaLabel="Toggle dark mode">
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={theme}
                initial={{ opacity: 0, rotate: -90, scale: 0.6 }}
                animate={{ opacity: 1, rotate: 0, scale: 1 }}
                exit={{ opacity: 0, rotate: 90, scale: 0.6 }}
                transition={{ duration: 0.2 }}
                className="flex"
              >
                {theme === "dark" ? <FaSun size={16} /> : <FaMoon size={16} />}
              </motion.span>
            </AnimatePresence>
          </IconButton>

          <div ref={notifRef} className="relative">
            <IconButton
              onClick={() => setNotifOpen((open) => !open)}
              ariaLabel="Notifications"
              aria-expanded={notifOpen}
            >
              <FaBell size={16} />
              <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-red-500" />
            </IconButton>

            <AnimatePresence>
              {notifOpen && (
                <motion.div {...dropdownMotionProps} className={dropdownPanelClass}>
                  <p className="border-b border-slate-100 px-4 py-3 text-sm font-semibold text-slate-900 dark:border-white/10 dark:text-white">
                    Notifications
                  </p>
                  <div className="px-4 py-8 text-center text-sm text-slate-400 dark:text-slate-500">
                    You&apos;re all caught up.
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div ref={avatarRef} className="relative">
            <IconButton
              onClick={() => setAvatarOpen((open) => !open)}
              ariaLabel="User menu"
              aria-expanded={avatarOpen}
            >
              <FaCircleUser size={22} />
            </IconButton>

            <AnimatePresence>
              {avatarOpen && (
                <motion.div {...dropdownMotionProps} className={`${dropdownPanelClass} p-1.5`}>
                  <motion.button
                    type="button"
                    whileHover={{ x: 2 }}
                    className={dropdownItemClass}
                  >
                    <FaGear size={14} /> Settings
                  </motion.button>
                  <motion.button
                    type="button"
                    whileHover={{ x: 2 }}
                    className={dropdownItemClass}
                  >
                    <FaArrowRightFromBracket size={14} /> Sign out
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {runScanButton("hidden lg:flex")}

          <IconButton
            onClick={() => setMobileOpen((open) => !open)}
            ariaLabel="Toggle menu"
            aria-expanded={mobileOpen}
            className="lg:hidden"
          >
            {mobileOpen ? <FaXmark size={18} /> : <FaBars size={18} />}
          </IconButton>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden lg:hidden"
          >
            <div className="mt-3 flex flex-col gap-1 border-t border-slate-100 pt-3 dark:border-white/10">
              {NAV_LINKS.map((link) => (
                <MotionLink
                  key={link.to}
                  to={link.to}
                  aria-current={isPathActive(location.pathname, link.to) ? "page" : undefined}
                  whileHover={{ x: 2 }}
                  whileTap={{ scale: 0.97 }}
                  className={navLinkClass(link.to, true)}
                >
                  {link.label}
                </MotionLink>
              ))}

              {runScanButton("mt-2")}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ScanProgressModal isOpen={scanning} stepIndex={stepIndex} phase={scanPhase} />
    </motion.nav>
  );
};

export default Navbar;
