const ChatRoom = require("../models/chat_room.model");
const Message = require("../models/message.model");
const { createNotification } = require("./notification.controller");

// POST /api/chat — tạo hoặc lấy phòng chat
const getOrCreateRoom = async (req, res) => {
  try {
    const { otherUserId, postId } = req.body;
    const myId = req.user._id;

    if (!otherUserId || !postId) {
      return res.status(400).json({ success: false, message: "Thiếu otherUserId hoặc postId" });
    }

    // Tìm phòng chat đã tồn tại
    let room = await ChatRoom.findOne({
      postId,
      $or: [
        { buyerId: myId, sellerId: otherUserId },
        { buyerId: otherUserId, sellerId: myId },
      ],
    })
      .populate("buyerId", "fullName avatarUrl")
      .populate("sellerId", "fullName avatarUrl")
      .populate("postId", "title");

    if (!room) {
      room = await ChatRoom.create({ postId, buyerId: myId, sellerId: otherUserId });
      await room.populate("buyerId", "fullName avatarUrl");
      await room.populate("sellerId", "fullName avatarUrl");
      await room.populate("postId", "title");
    }

    // Lấy tin nhắn gần nhất (50 tin)
    const messages = await Message.find({ chatRoomId: room._id })
      .populate("senderId", "fullName avatarUrl")
      .sort({ createdAt: 1 })
      .limit(50);

    res.json({ success: true, data: { room, messages } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/chat — danh sách phòng chat của tôi
const getMyRooms = async (req, res) => {
  try {
    const myId = req.user._id;

    const rooms = await ChatRoom.find({
      $or: [{ buyerId: myId }, { sellerId: myId }],
    })
      .populate("buyerId", "fullName avatarUrl")
      .populate("sellerId", "fullName avatarUrl")
      .populate("postId", "title");

    // unreadCount: 1 query duy nhất cho tất cả room (thay cho N query lồng trong map cũ)
    const roomIds = rooms.map((r) => r._id);
    const unreadAgg = await Message.aggregate([
      { $match: { chatRoomId: { $in: roomIds }, senderId: { $ne: myId }, isRead: false } },
      { $group: { _id: "$chatRoomId", count: { $sum: 1 } } },
    ]);
    const unreadMap = Object.fromEntries(unreadAgg.map((u) => [u._id.toString(), u.count]));

    const result = rooms.map((room) => ({
      _id: room._id,
      postId: room.postId,
      buyerId: room.buyerId,
      sellerId: room.sellerId,
      lastMessage: room.lastMessage,
      lastMessageAt: room.lastMessageAt || room.createdAt,
      unreadCount: unreadMap[room._id.toString()] || 0,
    }));

    result.sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt));
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/chat/:roomId/messages — lấy tin nhắn (có phân trang)
const getMessages = async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const myId = req.user._id;

    // Xác nhận user thuộc phòng này
    const room = await ChatRoom.findById(req.params.roomId);
    if (!room) return res.status(404).json({ success: false, message: "Không tìm thấy phòng chat" });

    const isParticipant =
      room.buyerId.equals(myId) || room.sellerId.equals(myId);
    if (!isParticipant)
      return res.status(403).json({ success: false, message: "Bạn không có quyền truy cập phòng chat này" });

    const total = await Message.countDocuments({ chatRoomId: room._id });
    const messages = await Message.find({ chatRoomId: room._id })
      .populate("senderId", "fullName avatarUrl")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    // Đánh dấu đã đọc tin nhắn của người kia
    await Message.updateMany(
      { chatRoomId: room._id, senderId: { $ne: myId }, isRead: false },
      { isRead: true }
    );

    res.json({
      success: true,
      data: messages.reverse(),
      total,
      page: Number(page),
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/chat/:roomId/messages — gửi tin nhắn
const sendMessage = async (req, res) => {
  try {
    const { content, messageType = "text" } = req.body;
    const myId = req.user._id;

    const room = await ChatRoom.findById(req.params.roomId);
    if (!room) return res.status(404).json({ success: false, message: "Không tìm thấy phòng chat" });

    const isParticipant = room.buyerId.equals(myId) || room.sellerId.equals(myId);
    if (!isParticipant)
      return res.status(403).json({ success: false, message: "Không có quyền gửi tin nhắn" });

    if (!content && messageType === "text") {
      return res.status(400).json({ success: false, message: "Nội dung tin nhắn không được trống" });
    }

    const message = await Message.create({
      chatRoomId: room._id,
      senderId: myId,
      messageContent: content || null,
      messageType,
    });

    await message.populate("senderId", "fullName avatarUrl");

    // Denormalize lastMessage vào chat_rooms (fix N+1 cho getMyRooms)
    room.lastMessage = messageType === "text" ? content : `[${messageType}]`;
    room.lastMessageAt = message.createdAt;
    room.lastSenderId = myId;
    await room.save();

    // Emit socket nếu có (server.js sẽ attach io)
    const io = req.app.get("io");
    if (io) {
      io.to(`chat_${room._id}`).emit("new_message", message);
    }

    // Tạo notification cho người nhận nếu họ không đang mở phòng chat này
    const otherUserId = room.buyerId.equals(myId) ? room.sellerId : room.buyerId;
    const isOtherInRoom = (io?.sockets.adapter.rooms.get(`chat_${room._id}`)?.size || 0) > 1;
    if (!isOtherInRoom) {
      await createNotification(
        {
          recipientId: otherUserId,
          type: "chat",
          title: "Tin nhắn mới",
          content: messageType === "text" ? content : "Bạn có tin nhắn mới",
          relatedType: "chat",
          relatedId: room._id,
          link: `/tin-nhan/${room._id}`,
        },
        io
      );
    }

    res.status(201).json({ success: true, data: message });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Admin xem toàn bộ rooms (dùng khi xử lý tranh chấp)
const adminGetRoomMessages = async (req, res) => {
  try {
    const room = await ChatRoom.findById(req.params.roomId)
      .populate("buyerId", "fullName email")
      .populate("sellerId", "fullName email")
      .populate("postId", "title");
    if (!room) return res.status(404).json({ success: false, message: "Không tìm thấy" });

    const messages = await Message.find({ chatRoomId: room._id })
      .populate("senderId", "fullName")
      .sort({ createdAt: 1 });

    res.json({ success: true, data: { room, messages } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getOrCreateRoom, getMyRooms, getMessages, sendMessage, adminGetRoomMessages };
