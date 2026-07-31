const mongoose = require("mongoose");

const awsConnectionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
  },

  accountId: {
    type: String,
    required: true,
  },

  accountAlias: {
    type: String,
  },

  region: {
    type: String,
    required: true,
  },

  accessKeyId: {
    type: String,
    required: true,
  },

  encryptedSecretKey: {
    type: String,
    required: true,
  },

  status: {
    type: String,
    enum: ["CONNECTED", "DISCONNECTED", "INVALID"],
    default: "CONNECTED",
  },

  connectedAt: {
    type: Date,
    default: Date.now,
  },

  lastValidatedAt: {
    type: Date,
  },
});

// Defense in depth: even if a controller/service forgets to strip the
// encrypted secret before sending a response, serialization can never leak
// it — this runs on every res.json()/JSON.stringify() of a document.
awsConnectionSchema.set("toJSON", {
  transform: (doc, ret) => {
    delete ret.encryptedSecretKey;
    return ret;
  },
});

module.exports = mongoose.model("AwsConnection", awsConnectionSchema);
