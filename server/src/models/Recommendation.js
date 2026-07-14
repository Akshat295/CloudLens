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
    },

    recommendation: {
      type: String,
    },

    reason: {
      type: String,
    },

    estimatedSavings: {
      type: Number,
      default: 0,
    },

    status: {
      type: String,
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