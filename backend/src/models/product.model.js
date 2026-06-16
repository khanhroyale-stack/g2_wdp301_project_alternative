const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    seller: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: [true, "Tên sản phẩm là bắt buộc"], trim: true },
    description: { type: String, required: [true, "Mô tả là bắt buộc"] },
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
    condition: {
      type: String,
      enum: ["Mới", "Như mới", "Đã dùng - Còn tốt", "Đã dùng - Có lỗi nhỏ"],
      required: true,
    },
    listingType: { type: String, enum: ["ban", "cho-thue"], required: true },

    // Bán
    salePrice: { type: Number, default: 0 },

    // Cho thuê
    rentalPricePerDay: { type: Number, default: 0 },
    rentalPricePerWeek: { type: Number, default: 0 },
    rentalPricePerMonth: { type: Number, default: 0 },
    depositAmount: { type: Number, default: 0 },

    location: { type: String, default: "Khu vực Hòa Lạc" },
    images: [{ type: String }],
    videos: [{ type: String }],
    invoiceImage: { type: String, default: "" },
    warrantyImage: { type: String, default: "" },

    status: {
      type: String,
      enum: ["PENDING", "ACTIVE", "REJECTED", "SOLD", "RENTING", "HIDDEN"],
      default: "PENDING",
    },
    rejectedReason: { type: String, default: "" },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    approvedAt: { type: Date },

    views: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

productSchema.index({ title: "text", description: "text" });

module.exports = mongoose.model("Product", productSchema);
