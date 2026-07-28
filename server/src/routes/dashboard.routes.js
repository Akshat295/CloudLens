const express = require("express");

const {
  getDashboard,
  getLatestRecommendations,
} = require("../controllers/dashboard.controller");

const router = express.Router();

// Dashboard Summary
router.get("/", getDashboard);

// Latest Recommendations
router.get(
  "/recommendations",
  getLatestRecommendations
);

module.exports = router;