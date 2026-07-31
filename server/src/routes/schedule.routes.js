const express = require("express");

const router = express.Router();

const {
  createSchedule,
  getSchedules,
  updateSchedule,
  deleteSchedule,
} = require("../controllers/schedule.controller");

router.post("/", createSchedule);
router.get("/", getSchedules);
router.patch("/:id", updateSchedule);
router.delete("/:id", deleteSchedule);

module.exports = router;
