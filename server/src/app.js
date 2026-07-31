const express = require("express");
const cors = require("cors");

const healthRoutes = require("./routes/health.routes");
const scanRoutes = require("./routes/scan.routes");
const scansRoutes = require("./routes/scans.routes");
const dashboardRoutes = require("./routes/dashboard.routes");
const recommendationRoutes = require("./routes/recommendation.routes");
const authRoutes = require("./routes/auth.routes");
const awsRoutes = require("./routes/aws.routes");
const scheduleRoutes = require("./routes/schedule.routes");
const notificationRoutes = require("./routes/notification.routes");
const analyticsRoutes = require("./routes/analytics.routes");
const reportRoutes = require("./routes/report.routes");
const auditLogRoutes = require("./routes/auditLog.routes");
const protect = require("./middleware/auth.middleware");
const notFound = require("./middlewares/notFound.middleware");
const errorHandler = require("./middlewares/errorHandler.middleware");

const app = express();

// Wide-open CORS (no origin restriction) plus a JWT read straight out of
// localStorage means literally any site could drive this API from a
// visitor's browser if it ever obtained a token. CORS_ORIGIN restricts
// cross-origin requests to known frontends; unset, it falls back to the
// Vite dev server's default port so local development keeps working
// unchanged.
const corsOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map((origin) => origin.trim())
  : ["http://localhost:5173"];

app.use(cors({ origin: corsOrigins }));
app.use(express.json());

// Every API is authenticated except signup/login. Both live under /api/auth
// alongside logout-all, which protects itself per-route since it needs a
// valid token to know which user to log out.
app.use("/api/auth", authRoutes);

app.use("/api/health", protect, healthRoutes);
app.use("/api/scan", protect, scanRoutes);
app.use("/api/scans", protect, scansRoutes);
app.use("/api/dashboard", protect, dashboardRoutes);
app.use("/api/recommendations", protect, recommendationRoutes);
app.use("/api/aws", protect, awsRoutes);
app.use("/api/schedules", protect, scheduleRoutes);
app.use("/api/notifications", protect, notificationRoutes);
app.use("/api/analytics", protect, analyticsRoutes);
app.use("/api/reports", protect, reportRoutes);
app.use("/api/audit-logs", protect, auditLogRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;