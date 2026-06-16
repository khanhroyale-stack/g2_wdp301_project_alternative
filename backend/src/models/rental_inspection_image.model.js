const mongoose = require("mongoose");

const rentalInspectionImageSchema = new mongoose.Schema(
  {
    rentalInspectionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RentalInspection",
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
    collection: "rental_inspection_images",
  }
);

module.exports = mongoose.model("RentalInspectionImage", rentalInspectionImageSchema);
