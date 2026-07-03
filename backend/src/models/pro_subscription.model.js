const mongoose = require("mongoose");

const proSubscriptionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    plan: {
      type: String,
      enum: ["1m", "3m", "12m"],
      required: true,
    },
    durationDays: {
      type: Number,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    vnpTxnRef: {
      type: String,
      required: true,
      unique: true,
    },
    vnpTransactionNo: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ["pending", "paid", "failed", "cancelled"],
      default: "pending",
    },
    startsAt: {
      type: Date,
      default: null,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
    note: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: "pro_subscriptions",
  }
);

module.exports = mongoose.model("ProSubscription", proSubscriptionSchema);
