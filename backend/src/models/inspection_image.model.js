const mongoose = require("mongoose");

const inspectionImageSchema = new mongoose.Schema(
  {
    inspectionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DeliveryInspection",
      required: true,
    },
    mediaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MediaFile",
      required: true,
    },
  },
  {
    timestamps: true,
    collection: "inspection_images",
  }
);

module.exports = mongoose.model("InspectionImage", inspectionImageSchema);
