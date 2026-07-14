const mongoose = require("mongoose");

const scanSchema = new mongoose.Schema(
  {
    startedAt: {
      type: Date,
      default: Date.now,
    },

    completedAt: {
      type: Date,
    },

    status: {
      type: String,
      enum: ["RUNNING", "COMPLETED", "FAILED"],
      default: "RUNNING",
    },

    totalResources: {
      type: Number,
      default: 0,
    },

    estimatedSavings: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Scan", scanSchema);