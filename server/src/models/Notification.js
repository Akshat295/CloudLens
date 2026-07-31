const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
  },

  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
  },

  scanCompleted: {
    type: Boolean,
    default: true,
  },

  highSeverity: {
    type: Boolean,
    default: true,
  },

  weeklyReport: {
    type: Boolean,
    default: true,
  },
});

module.exports = mongoose.model("Notification", notificationSchema);
