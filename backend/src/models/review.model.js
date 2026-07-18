const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    reviewerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    reviewUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProductPost",
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
    reviewType: {
      type: String,
      enum: ["seller", "buyer", "renter", "owner"],
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      default: null,
    },
    isHidden: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    collection: "reviews",
  }
);

reviewSchema.index({ reviewerId: 1, orderId: 1 }, { unique: true, sparse: true });
reviewSchema.index({ reviewerId: 1, rentalContractId: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model("Review", reviewSchema);
