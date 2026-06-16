const ChatRoom = require("../models/chat_room.model");
const Message = require("../models/message.model");
const ProductPost = require("../models/product_post.model");

const getOrCreateChat = async (req, res) => {
  try {
    const { otherUserId, productId } = req.body;
    const myId = req.user._id;

    let chatRoom = await ChatRoom.findOne({
      postId: productId,
      $or: [
        { buyerId: myId, sellerId: otherUserId },
        { buyerId: otherUserId, sellerId: myId }
      ]
    });

    if (!chatRoom) {
      chatRoom = await ChatRoom.create({
        postId: productId,
        buyerId: myId,
        sellerId: otherUserId,
      });
    }

    await chatRoom.populate("buyerId", "name avatar");
    await chatRoom.populate("sellerId", "name avatar");
    await chatRoom.populate("postId", "title");

    const messages = await Message.find({ chatRoomId: chatRoom._id }).sort({ createdAt: 1 });

    const responseData = {
       _id: chatRoom._id,
       participants: [chatRoom.buyerId, chatRoom.sellerId],
       product: chatRoom.postId,
       messages: messages.map(m => ({
           _id: m._id,
           sender: m.senderId,
           content: m.messageContent,
           image: m.messageType === 'image' ? m.mediaId : null,
           isRead: m.isRead,
           createdAt: m.createdAt
       }))
    };

    res.json({ success: true, data: responseData });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getMyChats = async (req, res) => {
  try {
    const myId = req.user._id;
    const chatRooms = await ChatRoom.find({
      $or: [{ buyerId: myId }, { sellerId: myId }]
    })
      .populate("buyerId", "name avatar")
      .populate("sellerId", "name avatar")
      .populate("postId", "title images");

    const results = [];
    for (let chat of chatRooms) {
       const lastMessage = await Message.findOne({ chatRoomId: chat._id }).sort({ createdAt: -1 });
       results.push({
           _id: chat._id,
           participants: [chat.buyerId, chat.sellerId],
           product: chat.postId,
           lastMessage: lastMessage ? lastMessage.messageContent : "",
           lastMessageAt: lastMessage ? lastMessage.createdAt : chat.createdAt,
       });
    }

    results.sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt));

    res.json({ success: true, data: results });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const sendMessage = async (req, res) => {
  try {
    const { content, image } = req.body;
    const chat = await ChatRoom.findById(req.params.chatId);
    if (!chat) return res.status(404).json({ success: false, message: "Không tìm thấy cuộc trò chuyện" });

    const message = await Message.create({
        chatRoomId: chat._id,
        senderId: req.user._id,
        messageContent: content,
        messageType: image ? "image" : "text",
    });

    res.json({ success: true, data: {
       _id: message._id,
       sender: message.senderId,
       content: message.messageContent,
       image: message.messageType === 'image' ? message.mediaId : null,
       isRead: message.isRead,
       createdAt: message.createdAt
    } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getOrCreateChat, getMyChats, sendMessage };
