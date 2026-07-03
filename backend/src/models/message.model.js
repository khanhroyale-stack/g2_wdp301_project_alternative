const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    chatRoomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ChatRoom",
      required: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    messageContent: {
      type: String,
      default: null,
    },
    messageType: {
      type: String,
      enum: ["text", "image", "file"],
      default: "text",
    },
    mediaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MediaFile",
      default: null,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    collection: "messages",
  }
);

messageSchema.index({ chatRoomId: 1, createdAt: 1 });

messageSchema.post("save", async function (doc, next) {
  try {
    const ChatRoom = mongoose.model("ChatRoom");
    let content = doc.messageContent;
    if (!content) {
      if (doc.messageType === "image") content = "[Hình ảnh]";
      else if (doc.messageType === "file") content = "[Tệp đính kèm]";
    }
    
    await ChatRoom.findByIdAndUpdate(doc.chatRoomId, {
      lastMessage: content,
      lastMessageAt: doc.createdAt,
      lastSenderId: doc.senderId
    });
    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model("Message", messageSchema);
