const mongoose = require("mongoose");

const resourceSchema = new mongoose.Schema(
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

    resourceType: {
      type: String,
      required: true,
    },

    resourceId: {
      type: String,
      required: true,
    },

    name: {
      type: String,
    },

    state: {
      type: String,
    },

    metadata: {
      type: Object,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Resource", resourceSchema);