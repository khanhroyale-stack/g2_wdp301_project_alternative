const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    notificationType: {
      type: String,
      enum: [
        "order_update",
        "rental_update",
        "payment",
        "report_update",
        "verification_update",
        "review",
        "chat",
        "system",
      ],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    collection: "notifications",
  }
);

module.exports = mongoose.model("Notification", notificationSchema);
