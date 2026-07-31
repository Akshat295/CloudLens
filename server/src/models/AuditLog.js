const mongoose = require("mongoose");
const { AUDIT_ACTION_VALUES } = require("../constants/auditActions");

const auditLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    action: {
      type: String,
      enum: AUDIT_ACTION_VALUES,
      required: true,
    },

    description: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

auditLogSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model("AuditLog", auditLogSchema);
