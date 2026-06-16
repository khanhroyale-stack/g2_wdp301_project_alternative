const mongoose = require("mongoose");

const reputationLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    reportId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Report",
      default: null,
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    changeAmount: {
      type: Number,
      required: true,
    },
    reason: {
      type: String,
      required: true,
    },
    violationLevel: {
      type: String,
      enum: ["none", "warning", "minor", "major"],
      default: "none",
    },
  },
  {
    timestamps: true,
    collection: "reputation_logs",
  }
);

module.exports = mongoose.model("ReputationLog", reputationLogSchema);
