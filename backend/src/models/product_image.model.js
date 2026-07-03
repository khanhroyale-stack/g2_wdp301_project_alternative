const mongoose = require("mongoose");

const productImageSchema = new mongoose.Schema(
  {
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProductPost",
      default: null,
    },
    // Legacy seed data used this field name.
    productPostId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProductPost",
      default: null,
    },
    mediaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MediaFile",
      default: null,
    },
    // Backward compatibility for records created from the older branch.
    field: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MediaFile",
      default: null,
    },
    // Legacy seed data stored raw image urls here.
    imageUrl: {
      type: String,
      default: null,
    },
    isThumbnail: {
      type: Boolean,
      default: false,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    collection: "product_images",
  }
);

module.exports = mongoose.model("ProductImage", productImageSchema);
