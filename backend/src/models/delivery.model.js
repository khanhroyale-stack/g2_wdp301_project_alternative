const mongoose = require("mongoose");

const deliverySchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      default: null,
    },
    rentalContractId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RentalContract",
      default: null,
    },
    shipperId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    pickupAddress: {
      type: String,
      required: true,
      trim: true,
    },
    deliveryAddress: {
      type: String,
      required: true,
      trim: true,
    },
    deliveryFee: {
      type: Number,
      default: 0,
      min: 0,
    },
    deliveryType: {
      type: String,
      enum: ["standard", "express"],
      default: "standard",
    },
    deliveryStatus: {
      type: String,
      enum: ["pending", "picking_up", "in_transit", "delivered", "failed"],
      default: "pending",
    },
  },
  {
    timestamps: true,
    collection: "deliveries",
  }
);

module.exports = mongoose.model("Delivery", deliverySchema);
