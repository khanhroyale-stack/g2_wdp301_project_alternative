const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema(
  {
    reporterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    reportedUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
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
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProductPost",
      default: null,
    },
    reportType: {
      type: String,
      enum: ["product_issue", "fraud", "damage", "missing_item", "other"],
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "investigating", "resolved", "dismissed"],
      default: "pending",
    },
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    adminNote: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: "reports",
  }
);

reportSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model("Report", reportSchema);
