const express = require("express");

const healthRoutes = require("./routes/health.routes");
const scanRoutes = require("./routes/scan.routes");

const app = express();

app.use(express.json());

app.use("/health", healthRoutes);
app.use("/scan", scanRoutes);

module.exports = app;