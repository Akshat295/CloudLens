const express = require("express");

const router = express.Router();

const { getAuditLogs } = require("../controllers/auditLog.controller");

router.get("/", getAuditLogs);

module.exports = router;
