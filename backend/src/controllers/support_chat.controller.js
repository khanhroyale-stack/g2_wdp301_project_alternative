const SupportMessage = require("../models/support_message.model");
const User = require("../models/user.model");

const getMessages = async (req, res) => {
  try {
    let customerId = req.user._id;

    if (req.user.role === "admin" && req.query.customerId) {
      customerId = req.query.customerId;
    }

    const messages = await SupportMessage.find({ customerId })
      .populate("senderId", "fullName avatarUrl role")
      .sort({ createdAt: 1 });

    await SupportMessage.updateMany(
      { customerId, senderId: { $ne: req.user._id }, isRead: false },
      { isRead: true }
    );

    res.json({ success: true, data: messages });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const sendMessage = async (req, res) => {
  try {
    const { content, customerId } = req.body;
    let targetCustomerId = req.user._id;

    if (req.user.role === "admin") {
      if (!customerId) {
        return res.status(400).json({ success: false, message: "Admin cần xác định customerId" });
      }
      targetCustomerId = customerId;
    }

    if (!content) {
      return res.status(400).json({ success: false, message: "Nội dung không được trống" });
    }

    const message = await SupportMessage.create({
      customerId: targetCustomerId,
      senderId: req.user._id,
      content,
    });

    await message.populate("senderId", "fullName avatarUrl role");

    const io = req.app.get("io");
    if (io) {
      io.to(`support_${targetCustomerId}`).emit("new_support_message", message);
      io.emit("support_list_updated");
    }

    res.status(201).json({ success: true, data: message });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getActiveCustomers = async (req, res) => {
  try {
    const uniqueCustomerIds = await SupportMessage.distinct("customerId");      

    const customers = await User.find({ _id: { $in: uniqueCustomerIds } })      
      .select("fullName avatarUrl email")
      .lean();

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
