const mongoose = require("mongoose");

const productImageSchema = new mongoose.Schema(
  {
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProductPost",
      required: true,
    },
    mediaId: {
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
    timestamps: true,
    collection: "product_images",
  }
);

module.exports = mongoose.model("ProductImage", productImageSchema);
