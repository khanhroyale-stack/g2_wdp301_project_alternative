const mongoose = require("mongoose");

const inspectionSchema = new mongoose.Schema(
  {
    shipper: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    order: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
    rental: { type: mongoose.Schema.Types.ObjectId, ref: "Rental" },
    inspectionType: {
      type: String,
      enum: ["pre_delivery", "post_delivery", "pre_rental", "post_rental"],
      required: true,
    },
    // Kết quả kiểm tra
    productMatch: { type: Boolean, default: true },
    conditionMatch: { type: Boolean, default: true },
    accessoriesComplete: { type: Boolean, default: true },
    // Ảnh bằng chứng
    frontImage: { type: String, default: "" },
    backImage: { type: String, default: "" },
    accessoriesImage: { type: String, default: "" },
    extraImages: [{ type: String }],
    // Ghi chú
    notes: { type: String, default: "" },
    // Lỗi phát hiện
    issueType: {
      type: String,
      enum: ["none", "seller_fault", "shipper_fault", "renter_fault"],
      default: "none",
    },
    issueDescription: { type: String, default: "" },
    // Trạng thái
    status: {
      type: String,
      enum: ["DRAFT", "SUBMITTED"],
      default: "DRAFT",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Inspection", inspectionSchema);
