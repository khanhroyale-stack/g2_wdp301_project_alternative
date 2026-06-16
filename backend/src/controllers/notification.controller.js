const Notification = require("../models/notification.model");

const getMyNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json({ success: true, data: notifications });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const markAllRead = async (req, res) => {
  try {
    await Notification.updateMany({ recipient: req.user._id, isRead: false }, { isRead: true });
    res.json({ success: true, message: "Đã đánh dấu đọc tất cả" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Helper để tạo notification từ các controller khác
const createNotification = async ({ recipientId, title, message, type, link }) => {
  try {
    await Notification.create({ recipient: recipientId, title, message, type, link });
  } catch (err) {
    console.error("Notification error:", err.message);
  }
};

module.exports = { getMyNotifications, markAllRead, createNotification };
