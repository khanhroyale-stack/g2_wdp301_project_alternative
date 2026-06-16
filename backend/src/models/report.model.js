const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema(
  {
    reporter: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    reportedUser: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    order: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
    rental: { type: mongoose.Schema.Types.ObjectId, ref: "Rental" },
    violationType: {
      type: String,
      enum: ["Sai mô tả", "Thiếu phụ kiện", "Lừa đảo", "Hư hỏng", "Nội dung không phù hợp", "Khác"],
      required: true,
    },
    content: { type: String, required: true },
    evidenceImages: [{ type: String }],
    status: {
      type: String,
      enum: ["PENDING", "PROCESSING", "RESOLVED", "REJECTED"],
      default: "PENDING",
    },
    adminNote: { type: String, default: "" },
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    resolvedAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Report", reportSchema);
