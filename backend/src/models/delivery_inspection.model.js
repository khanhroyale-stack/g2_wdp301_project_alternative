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
      enum: ["passed", "failed"],
      default: "passed",
    },
    faultType: {
      type: String,
      enum: ["seller", "shipper", null],
      default: null,
    },
    conditionNote: {
      type: String,
      default: null,
    },
    isCorrectProduct: {
      type: Boolean,
      default: true,
    },
    isCorrectCategoryBrandModel: {
      type: Boolean,
      default: true,
    },
    isCorrectImage: {
      type: Boolean,
      default: true,
    },
    // Legacy field kept for old inspection records and clients.
    isCorrectModel: {
      type: Boolean,
      default: true,
    },
    isCorrectCondition: {
      type: Boolean,
      default: true,
    },
    isCorrectQuantity: {
      type: Boolean,
      default: true,
    },
    isCorrectColorSizeVersion: {
      type: Boolean,
      default: true,
    },
    isAccessoriesEnough: {
      type: Boolean,
      default: true,
    },
    hasNoNewDamage: {
      type: Boolean,
      default: true,
    },
    hasNoCounterfeitSigns: {
      type: Boolean,
      default: true,
    },
    isSerialMatched: {
      type: Boolean,
      default: true,
    },
    isBasicFunctionWorking: {
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
