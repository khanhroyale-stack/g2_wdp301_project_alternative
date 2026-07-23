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
      default: null,
    },
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProductPost",
      required: true,
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
    },
    rentalContractId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RentalContract",
    },
    reviewType: {
      type: String,
      enum: ["seller", "buyer", "renter", "owner", "product"],
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

reviewSchema.index(
  { reviewerId: 1, orderId: 1 },
  {
    unique: true,
    partialFilterExpression: { orderId: { $type: "objectId" } },
  }
);
reviewSchema.index(
  { reviewerId: 1, rentalContractId: 1 },
  {
    unique: true,
    partialFilterExpression: { rentalContractId: { $type: "objectId" } },
  }
);

module.exports = mongoose.model("Review", reviewSchema);
