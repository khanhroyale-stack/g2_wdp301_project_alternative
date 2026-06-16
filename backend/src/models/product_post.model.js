const mongoose = require("mongoose");

const productPostSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    productType: {
      type: String,
      enum: ["sale", "rent", "both"],
      required: true,
    },
    salePrice: {
      type: Number,
      default: 0,
      min: 0,
    },
    rentPricePerDay: {
      type: Number,
      default: 0,
      min: 0,
    },
    rentPricePerWeek: {
      type: Number,
      default: 0,
      min: 0,
    },
    rentPricePerMonth: {
      type: Number,
      default: 0,
      min: 0,
    },
    depositAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    location: {
      type: String,
      default: null,
      trim: true,
    },
    conditionStatus: {
      type: String,
      enum: ["new", "like_new", "good", "fair", "poor"],
      required: true,
    },
    quantity: {
      type: Number,
      default: 1,
      min: 1,
    },
    invoiceField: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MediaFile",
      default: null,
    },
    warrantyField: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MediaFile",
      default: null,
    },
    videoField: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MediaFile",
      default: null,
    },
    postStatus: {
      type: String,
      enum: ["pending", "approved", "rejected", "closed"],
      default: "pending",
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    approvedAt: {
      type: Date,
      default: null,
    },
    rejectReason: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: "product_posts",
  }
);

module.exports = mongoose.model("ProductPost", productPostSchema);
