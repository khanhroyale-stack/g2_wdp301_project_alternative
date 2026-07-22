const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    buyerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProductPost",
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },
    productPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    shippingFee: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    buyerAddress: {
      type: String,
      required: true,
      trim: true,
    },
    buyerPhone: {
      type: String,
      required: true,
      trim: true,
    },
    recipientName: {
      type: String,
      required: true,
      trim: true,
    },
    note: {
      type: String,
      default: "",
      trim: true,
    },
    paymentMethod: {
      type: String,
      enum: ["COD", "VNPAY"],
      default: "COD",
    },
    paymentStatus: {
      type: String,
      enum: ["unpaid", "paid"],
      default: "unpaid",
    },
    vnpTxnRef: {
      type: String,
      default: null,
    },
    vnpTransactionNo: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: [
        "PENDING",
        "SELLER_CONFIRMED",
        "PICKING_UP",
        "PICKED_UP",
        "DELIVERING",
        "DELIVERED",
        "COMPLETED",
        "CANCELLED",
      ],
      default: "PENDING",
    },
    inventoryStatus: {
      type: String,
      enum: ["reserved", "released", "committed"],
      default: "reserved",
    },
  },
  {
    timestamps: true,
    collection: "orders",
  }
);

module.exports = mongoose.model("Order", orderSchema);
