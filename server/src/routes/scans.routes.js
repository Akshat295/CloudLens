const express = require("express");

const router = express.Router();

const {
  getScans,
  getScanById,
} = require("../controllers/scans.controller");

router.get("/", getScans);
router.get("/:id", getScanById);

module.exports = router;
