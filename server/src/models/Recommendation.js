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

    // Defaults to COST since that's what every pre-existing EC2/S3/RDS
    // recommendation actually is — those callers don't pass `category` at
    // all, so this default is what keeps their saveRecommendation() calls
    // working unchanged while still getting a correct category. IAM's
    // scanner is the only caller that passes `category: "SECURITY"`
    // explicitly.
    category: {
      type: String,
      enum: ["COST", "SECURITY", "PERFORMANCE", "RELIABILITY", "OPERATIONAL_EXCELLENCE"],
      default: "COST",
    },

    severity: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH"],
      required: true,
    },

    // NONE/STOP/DOWNSIZE/UPSIZE/REVIEW are the original EC2/S3/RDS action
    // set, left untouched. The remaining values are IAM-specific, added so
    // IAM recommendations carry a real remediation action instead of a
    // generic REVIEW/STOP.
    action: {
      type: String,
      enum: [
        "NONE",
        "STOP",
        "DOWNSIZE",
        "UPSIZE",
        "REVIEW",
        "ENABLE_MFA",
        "DELETE_UNUSED_KEY",
        "REVIEW_PERMISSIONS",
        "ROTATE_ACCESS_KEY",
        "REMOVE_ADMIN_ACCESS",
        "DELETE_UNUSED_ROLE",
        "TAG_RESOURCE",
      ],
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