const Notification = require("../models/notification.model");

// GET /api/notifications — lấy thông báo của tôi
const getMyNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json({ success: true, data: notifications });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/notifications/unread-count
const getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({ userId: req.user._id, isRead: false });
    res.json({ success: true, count });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /api/notifications/read-all
const markAllRead = async (req, res) => {
  try {
    await Notification.updateMany({ userId: req.user._id, isRead: false }, { isRead: true });
    res.json({ success: true, message: "Đã đánh dấu đọc tất cả" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /api/notifications/:id/read
const markOneRead = async (req, res) => {
  try {
    await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { isRead: true }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Helper nội bộ — gọi từ các controller khác để tạo notification + bắn real-time qua socket
 * @param {object} payload
 * @param {string} payload.recipientId  — userId nhận
 * @param {string} payload.type         — notificationType enum
 * @param {string} payload.title
 * @param {string} payload.content
 * @param {string} [payload.relatedType] — order|rental|report|review|chat|system
 * @param {string} [payload.relatedId]
 * @param {string} [payload.link]
 * @param {object} [io] — socket.io instance (req.app.get("io")), optional
 */
const createNotification = async ({ recipientId, type, title, content, relatedType, relatedId, link }, io) => {
  try {
    const noti = await Notification.create({
      userId: recipientId,
      notificationType: type,
      title,
      content,
      relatedType: relatedType || null,
      relatedId: relatedId || null,
      link: link || null,
    });
    io?.to(`user_${recipientId}`).emit("new_notification", noti);
    return noti;
  } catch (err) {
    console.error("[createNotification] error:", err.message);
  }
};

module.exports = { getMyNotifications, getUnreadCount, markAllRead, markOneRead, createNotification };
