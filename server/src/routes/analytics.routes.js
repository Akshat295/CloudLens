const express = require("express");

const router = express.Router();

const {
  costTrend,
  savingsTrend,
  resourceGrowth,
  highAlertsTrend,
} = require("../controllers/analytics.controller");

router.get("/cost-trend", costTrend);
router.get("/savings-trend", savingsTrend);
router.get("/resource-growth", resourceGrowth);
router.get("/high-alerts-trend", highAlertsTrend);

module.exports = router;
