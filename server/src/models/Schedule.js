const mongoose = require("mongoose");

const scheduleSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
  },

  frequency: {
    type: String,
    enum: ["hourly", "daily", "weekly"],
    required: true,
  },

  enabled: {
    type: Boolean,
    default: true,
  },

  lastRun: {
    type: Date,
    default: null,
  },

  nextRun: {
    type: Date,
    required: true,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Schedule", scheduleSchema);
