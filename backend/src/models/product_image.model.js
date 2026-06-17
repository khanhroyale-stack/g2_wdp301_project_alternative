const mongoose = require("mongoose");

const productImageSchema = new mongoose.Schema(
  {
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProductPost",
      required: true,
    },
    field: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MediaFile",
      required: true,
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
    timestamps: { createdAt: true, updatedAt: false },  // chỉ createdAt, không updatedAt
    collection: "product_images",
  }
);

module.exports = mongoose.model("ProductImage", productImageSchema);

module.exports = mongoose.model("ProductImage", productImageSchema);
