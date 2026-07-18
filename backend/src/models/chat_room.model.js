const mongoose = require("mongoose");

const chatRoomSchema = new mongoose.Schema(
  {
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProductPost",
      required: true,
    },
    buyerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    lastMessage: {
      type: String,
      default: null,
    },
    lastMessageAt: {
      type: Date,
      default: null,
    },
    lastSenderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
    collection: "chat_rooms",
  }
);

module.exports = mongoose.model("ChatRoom", chatRoomSchema);
