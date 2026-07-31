import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { SkeletonTheme } from "react-loading-skeleton";
import Dashboard from "./pages/Dashboard";
import ScanHistory from "./pages/ScanHistory";
import ScanDetail from "./pages/ScanDetail";
import Recommendations from "./pages/Recommendations";
import ConnectAws from "./pages/ConnectAws";
import ScheduleScan from "./pages/ScheduleScan";
import NotificationSettings from "./pages/NotificationSettings";
import Analytics from "./pages/Analytics";
import AuditLogs from "./pages/AuditLogs";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ProtectedRoute from "./components/ProtectedRoute";
import AppToaster from "./components/AppToaster";

// Keying <Routes> itself on the pathname (rather than each <Route>'s element)
// is what lets AnimatePresence treat a navigation as a full child swap, so it
// can play the outgoing page's exit animation before the new one mounts.
const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/scan-history" element={<ScanHistory />} />
          <Route path="/scan-history/:scanId" element={<ScanDetail />} />
          <Route path="/recommendations" element={<Recommendations />} />
          <Route path="/connect-aws" element={<ConnectAws />} />
          <Route path="/schedules" element={<ScheduleScan />} />
          <Route path="/notifications" element={<NotificationSettings />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/audit-logs" element={<AuditLogs />} />
        </Route>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
      </Routes>
    </AnimatePresence>
  );
};

function App() {
  return (
    <SkeletonTheme
      baseColor="var(--skeleton-base-color)"
      highlightColor="var(--skeleton-highlight-color)"
      borderRadius="0.5rem"
    >
      <AppToaster />
      <BrowserRouter>
        <AnimatedRoutes />
      </BrowserRouter>
    </SkeletonTheme>
  );
}

export default App;
