const express = require("express");

const {
  getRecommendations,
  ignoreRecommendation,
  resolveRecommendation,
  stopRecommendation,
} = require("../controllers/recommendation.controller");

const router = express.Router();

router.get("/", getRecommendations);

router.patch("/:id/ignore", ignoreRecommendation);

router.patch("/:id/resolve", resolveRecommendation);

router.post("/:id/stop", stopRecommendation);

module.exports = router;