const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    reviewer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    reviewee: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    order: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
    rental: { type: mongoose.Schema.Types.ObjectId, ref: "Rental" },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, default: "" },
    isHidden: { type: Boolean, default: false },
    reviewType: { type: String, enum: ["mua", "thue"], required: true },
  },
  { timestamps: true }
);

// Mỗi giao dịch chỉ review 1 lần
reviewSchema.index({ reviewer: 1, order: 1 }, { unique: true, sparse: true });
reviewSchema.index({ reviewer: 1, rental: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model("Review", reviewSchema);
