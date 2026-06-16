const Chat = require("../models/chat.model");

const getOrCreateChat = async (req, res) => {
  try {
    const { otherUserId, productId } = req.body;
    const myId = req.user._id;

    let chat = await Chat.findOne({
      participants: { $all: [myId, otherUserId] },
      product: productId,
    });

    if (!chat) {
      chat = await Chat.create({
        participants: [myId, otherUserId],
        product: productId,
        messages: [],
      });
    }

    await chat.populate("participants", "name avatar");
    await chat.populate("product", "title images");
    res.json({ success: true, data: chat });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getMyChats = async (req, res) => {
  try {
    const chats = await Chat.find({ participants: req.user._id })
      .populate("participants", "name avatar")
      .populate("product", "title images")
      .sort({ lastMessageAt: -1 });
    res.json({ success: true, data: chats });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const sendMessage = async (req, res) => {
  try {
    const { content, image } = req.body;
    const chat = await Chat.findById(req.params.chatId);
    if (!chat) return res.status(404).json({ success: false, message: "Không tìm thấy cuộc trò chuyện" });

    chat.messages.push({ sender: req.user._id, content, image });
    chat.lastMessage = content || "Đã gửi ảnh";
    chat.lastMessageAt = new Date();
    await chat.save();
    res.json({ success: true, data: chat });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getOrCreateChat, getMyChats, sendMessage };
