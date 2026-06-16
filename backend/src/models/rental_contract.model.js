const mongoose = require("mongoose");

const rentalContractSchema = new mongoose.Schema(
  {
    requestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RentalRequest",
      required: true,
    },
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProductPost",
      required: true,
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    renterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    rentalFee: {
      type: Number,
      required: true,
      min: 0,
    },
    depositAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    handoverMethod: {
      type: String,
      enum: ["meet_directly", "shipping"],
      required: true,
    },
    lateFeePerDay: {
      type: Number,
      default: 0,
      min: 0,
    },
    accessoriesNote: {
      type: String,
      default: null,
    },
    compensationAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    depositRefundAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    contractStatus: {
      type: String,
      enum: ["active", "completed", "cancelled", "disputed"],
      default: "active",
    },
  },
  {
    timestamps: true,
    collection: "rental_contracts",
  }
);

module.exports = mongoose.model("RentalContract", rentalContractSchema);
