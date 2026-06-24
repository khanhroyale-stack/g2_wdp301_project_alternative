const SupportMessage = require("../models/support_message.model");
const User = require("../models/user.model");

// GET /api/support-chat
// Cho Customer lấy lịch sử chat của mình, hoặc Admin lấy lịch sử chat với 1 customer
const getMessages = async (req, res) => {
  try {
    let customerId = req.user._id;

    // Nếu là admin và truyền customerId vào query thì lấy lịch sử của khách hàng đó
    if (req.user.role === "admin" && req.query.customerId) {
      customerId = req.query.customerId;
    }

    const messages = await SupportMessage.find({ customerId })
      .populate("senderId", "fullName avatarUrl role")
      .sort({ createdAt: 1 });

    // Mark as read cho tin nhắn người khác gửi
    await SupportMessage.updateMany(
      { customerId, senderId: { $ne: req.user._id }, isRead: false },
      { isRead: true }
    );

    res.json({ success: true, data: messages });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/support-chat
// Gửi tin nhắn support
const sendMessage = async (req, res) => {
  try {
    const { content, customerId } = req.body;
    let targetCustomerId = req.user._id;

    // Nếu Admin rep thì sẽ phải có customerId
    if (req.user.role === "admin") {
      if (!customerId) {
        return res.status(400).json({ success: false, message: "Admin cần chỉ định customerId" });
      }
      targetCustomerId = customerId;
    }

    if (!content) {
      return res.status(400).json({ success: false, message: "Nội dung không được rỗng" });
    }

    const message = await SupportMessage.create({
      customerId: targetCustomerId,
      senderId: req.user._id,
      content,
    });

    await message.populate("senderId", "fullName avatarUrl role");

    // Emit realtime
    const io = req.app.get("io");
    if (io) {
      io.to(`support_${targetCustomerId}`).emit("new_support_message", message);
      // Gửi event để admin update list danh sách user
      io.emit("support_list_updated");
    }

    res.status(201).json({ success: true, data: message });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/support-chat/admin/users
// Admin xem danh sách các khách hàng đã nhắn tin support
const getActiveCustomers = async (req, res) => {
  try {
    // Tìm ra những user từng gửi/nhận support message
    const uniqueCustomerIds = await SupportMessage.distinct("customerId");
    
    // Lấy thông tin user
    const customers = await User.find({ _id: { $in: uniqueCustomerIds } })
      .select("fullName avatarUrl email")
      .lean();

    // Tính tin nhắn cuối cùng & số lượng chưa đọc
    for (let c of customers) {
      const lastMsg = await SupportMessage.findOne({ customerId: c._id })
        .sort({ createdAt: -1 })
        .lean();
      
      const unreadCount = await SupportMessage.countDocuments({
        customerId: c._id,
        senderId: { $ne: req.user._id },
        isRead: false
      });

      c.lastMessage = lastMsg ? lastMsg.content : "";
      c.lastMessageAt = lastMsg ? lastMsg.createdAt : null;
      c.unreadCount = unreadCount;
    }

    customers.sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt));

    res.json({ success: true, data: customers });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getMessages,
  sendMessage,
  getActiveCustomers
};
