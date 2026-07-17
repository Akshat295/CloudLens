const mongoose = require("mongoose");

const recommendationSchema = new mongoose.Schema(
  {
    scanId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Scan",
      required: true,
    },

    resourceId: {
      type: String,
      required: true,
    },

    severity: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH"],
      required: true,
    },

    action: {
      type: String,
      enum: ["NONE", "STOP", "DOWNSIZE", "UPSIZE"],
      required: true,
    },

    confidence: {
      type: Number,
      default: 100,
    },

    recommendation: {
      type: String,
      required: true,
    },

    reason: {
      type: String,
      required: true,
    },

    hourlyPrice: {
      type: Number,
      default: 0,
    },

    monthlyCost: {
      type: Number,
      default: 0,
    },

    estimatedSavings: {
      type: Number,
      default: 0,
    },

    status: {
      type: String,
      enum: ["OPEN", "RESOLVED", "IGNORED"],
      default: "OPEN",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "Recommendation",
  recommendationSchema
);