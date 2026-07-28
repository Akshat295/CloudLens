const express = require("express");

const router = express.Router();

const { scan } = require("../controllers/scan.controller");

router.post("/", scan);

module.exports = router;