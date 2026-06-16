const mongoose = require("mongoose");

const deliveryInspectionSchema = new mongoose.Schema(
  {
    deliveryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Delivery",
      required: true,
    },
    shipperId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    inspectionType: {
      type: String,
      enum: ["pickup", "receive"],
      required: true,
    },
    conditionNote: {
      type: String,
      default: null,
    },
    isMatchDescription: {
      type: Boolean,
      default: true,
    },
    isDamagedByShipper: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    collection: "delivery_inspections",
  }
);

module.exports = mongoose.model("DeliveryInspection", deliveryInspectionSchema);
