const express = require("express");

const router = express.Router();

const { testConnection, connect, getAccount, disconnect } = require("../controllers/awsConnection.controller");

router.post("/test-connection", testConnection);
router.post("/connect", connect);
router.get("/account", getAccount);
router.delete("/disconnect", disconnect);

module.exports = router;
