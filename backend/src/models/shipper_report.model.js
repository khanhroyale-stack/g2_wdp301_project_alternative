const mongoose = require("mongoose");

const shipperReportSchema = new mongoose.Schema(
  {
    deliveryId: { type: mongoose.Schema.Types.ObjectId, ref: "Delivery", required: true },
    shipperId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    issueType: {
      type: String,
      enum: ["buyer_unavailable", "wrong_address", "seller_unavailable", "product_damaged", "vehicle_issue", "other"],
      required: true,
    },
    description: { type: String, required: true, trim: true },
    status: { type: String, enum: ["pending", "investigating", "resolved", "dismissed"], default: "pending" },
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    adminNote: { type: String, default: null, trim: true },
  },
  { timestamps: true, collection: "shipper_reports" }
);

shipperReportSchema.index({ deliveryId: 1, createdAt: -1 });
shipperReportSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model("ShipperReport", shipperReportSchema);
