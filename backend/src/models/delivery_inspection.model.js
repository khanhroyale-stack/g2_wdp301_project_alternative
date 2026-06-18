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
    result: {
      type: String,
      enum: ["passed", "failed_seller_fault", "failed_shipper_fault"],
      default: "passed",
    },
    conditionNote: {
      type: String,
      default: null,
    },
    isCorrectProduct: {
      type: Boolean,
      default: true,
    },
    isCorrectImage: {
      type: Boolean,
      default: true,
    },
    isCorrectModel: {
      type: Boolean,
      default: true,
    },
    isCorrectCondition: {
      type: Boolean,
      default: true,
    },
    isAccessoriesEnough: {
      type: Boolean,
      default: true,
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
