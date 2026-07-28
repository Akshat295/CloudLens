const express = require("express");
const cors = require("cors");

const healthRoutes = require("./routes/health.routes");
const scanRoutes = require("./routes/scan.routes");
const scansRoutes = require("./routes/scans.routes");
const dashboardRoutes = require("./routes/dashboard.routes");
const recommendationRoutes = require("./routes/recommendation.routes");
const notFound = require("./middlewares/notFound.middleware");
const errorHandler = require("./middlewares/errorHandler.middleware");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/health", healthRoutes);
app.use("/api/scan", scanRoutes);
app.use("/api/scans", scansRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/recommendations", recommendationRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;