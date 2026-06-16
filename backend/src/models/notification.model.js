const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
      type: String,
      enum: [
        "ACCOUNT_APPROVED", "ACCOUNT_REJECTED",
        "POST_APPROVED", "POST_REJECTED",
        "NEW_ORDER", "ORDER_CONFIRMED",
        "NEW_RENTAL_REQUEST", "RENTAL_ACCEPTED", "RENTAL_REJECTED",
        "DELIVERY_ASSIGNED", "DELIVERY_COMPLETED",
        "RENTAL_EXPIRING", "NEW_REVIEW", "NEW_REPORT", "REPORT_RESOLVED",
        "GENERAL"
      ],
      default: "GENERAL",
    },
    isRead: { type: Boolean, default: false },
    link: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notification", notificationSchema);
