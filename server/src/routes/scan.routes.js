const express = require("express");

const router = express.Router();

const { scan } = require("../controllers/scan.controller");

router.get("/", scan);

module.exports = router;