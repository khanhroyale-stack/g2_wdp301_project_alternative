const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    buyer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    seller: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    totalAmount: { type: Number, required: true },
    shippingFee: { type: Number, default: 0 },
    note: { type: String, default: "" },
    status: {
      type: String,
      enum: [
        "PENDING",           // Chờ seller xác nhận
        "SELLER_CONFIRMED",  // Seller đã xác nhận, chờ shipper
        "CANCELLED",         // Đã hủy
        "PICKING_UP",        // Shipper đang đến lấy hàng
        "PICKED_UP",         // Shipper đã lấy được hàng
        "DELIVERING",        // Đang giao cho buyer
        "DELIVERED",         // Buyer đã nhận hàng
        "COMPLETED",         // Hoàn tất (buyer xác nhận)
      ],
      default: "PENDING",
    },
    cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    cancelledReason: { type: String, default: "" },
    shipper: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    deliveryAddress: { type: String, default: "" },
    // Lịch sử trạng thái
    statusHistory: [
      {
        status: String,
        changedAt: { type: Date, default: Date.now },
        changedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        note: String,
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
