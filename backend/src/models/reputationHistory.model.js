const mongoose = require("mongoose");

const reputationHistorySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    pointsDeducted: { type: Number, required: true },
    reason: { type: String, required: true },
    violationType: {
      type: String,
      enum: ["minor", "medium", "severe"],
      default: "minor",
    },
    scoreAfter: { type: Number, required: true },
    processedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // admin
    relatedReport: { type: mongoose.Schema.Types.ObjectId, ref: "Report" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ReputationHistory", reputationHistorySchema);
