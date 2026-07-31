const express = require("express");

const router = express.Router();

const { exportScanReport } = require("../controllers/report.controller");

router.get("/scan/:id", exportScanReport);

module.exports = router;
