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
    imageType: {
      type: String,
      enum: ["front", "back", "accessories"],
      required: true,
    },
  },
  {
    timestamps: true,
    collection: "inspection_images",
  }
);

module.exports = mongoose.model("InspectionImage", inspectionImageSchema);
