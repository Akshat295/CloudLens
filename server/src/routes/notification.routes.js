const express = require("express");

const router = express.Router();

const { getSettings, updateSettings } = require("../controllers/notification.controller");

router.get("/settings", getSettings);
router.patch("/settings", updateSettings);

module.exports = router;
