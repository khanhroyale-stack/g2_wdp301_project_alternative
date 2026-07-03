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
    relatedType: {
      type: String,
      enum: ["Order", "RentalContract", "Report", "Review", "ChatRoom", "System"],
      default: null,
    },
    relatedId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "relatedType",
      default: null,
    },
    link: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: "notifications",
  }
);

notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model("Notification", notificationSchema);
