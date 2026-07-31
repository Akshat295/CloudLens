const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },

    password: {
      type: String,
      required: true,
    },

    // Bumped whenever "logout from all devices" is triggered — every JWT
    // issued before the bump carries the old value and is rejected by the
    // protect middleware, without needing a server-side token blacklist.
    tokenVersion: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Defense in depth: even if a controller/service forgets to strip the
// password hash before sending a response, serialization can never leak it.
userSchema.set("toJSON", {
  transform: (doc, ret) => {
    delete ret.password;
    return ret;
  },
});

module.exports = mongoose.model("User", userSchema);
