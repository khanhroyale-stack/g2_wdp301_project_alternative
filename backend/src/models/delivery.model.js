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
      default: null,
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
    status: {
      type: String,
      enum: [
        "WAITING_SHIPPER",
        "SHIPPER_ACCEPTED",
        "PICKING_UP",
        "PICKED_UP",
        "DELIVERING",
        "DELIVERED",
        "COMPLETED",
        "FAILED",
      ],
      default: "WAITING_SHIPPER",
    },
    failureReason: {
      type: String,
      default: "",
      trim: true,
    },
    history: {
      type: [
        {
          status: {
            type: String,
            required: true,
          },
          changedAt: {
            type: Date,
            default: Date.now,
          },
          note: {
            type: String,
            default: "",
            trim: true,
          },
        },
      ],
      default: [{ status: "WAITING_SHIPPER" }],
    },
  },
  {
    timestamps: true,
    collection: "deliveries",
  }
);

module.exports = mongoose.model("Delivery", deliverySchema);
