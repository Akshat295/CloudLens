const mongoose = require("mongoose");

const insightSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    scanId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Scan",
      required: true,
    },

    category: {
      type: String,
      enum: ["SECURITY", "COST", "STORAGE", "LIFECYCLE", "GENERAL"],
      default: "GENERAL",
    },

    severity: {
      type: String,
      enum: ["INFO", "LOW", "MEDIUM", "HIGH"],
      default: "INFO",
    },

    message: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Insight", insightSchema);
