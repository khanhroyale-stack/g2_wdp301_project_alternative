const mongoose = require("mongoose");

const rentalSchema = new mongoose.Schema(
  {
    renter: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    totalDays: { type: Number, required: true },
    rentalFee: { type: Number, required: true },
    depositAmount: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },
    status: {
      type: String,
      enum: ["PENDING", "ACCEPTED", "REJECTED", "ACTIVE", "RETURN_REQUESTED", "RETURNED", "COMPLETED", "CANCELLED", "DISPUTED"],
      default: "PENDING",
    },
    rejectedReason: { type: String, default: "" },
    compensationAmount: { type: Number, default: 0 },
    compensationReason: { type: String, default: "" },
    returnNote: { type: String, default: "" },
    preRentalImages: [{ type: String }],
    postRentalImages: [{ type: String }],
    note: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Rental", rentalSchema);
