const mongoose = require("mongoose");

const rentalInspectionSchema = new mongoose.Schema(
  {
    contractId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RentalContract",
      required: true,
    },
    inspectorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    inspectionType: {
      type: String,
      enum: ["handover", "return"],
      required: true,
    },
    conditionNote: {
      type: String,
      default: null,
    },
    damageNote: {
      type: String,
      default: null,
    },
    missingAccessories: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: "rental_inspections",
  }
);

module.exports = mongoose.model("RentalInspection", rentalInspectionSchema);
