const mongoose = require("mongoose");

const reportEvidenceSchema = new mongoose.Schema(
  {
    reportId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Report",
      required: true,
    },
    mediaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MediaFile",
      required: true,
    },
    evidenceType: {
      type: String,
      enum: ["image", "video", "document"],
      default: "image",
    },
  },
  {
    timestamps: true,
    collection: "report_evidences",
  }
);

module.exports = mongoose.model("ReportEvidence", reportEvidenceSchema);
