const User = require("../models/user.model");
const ReputationHistory = require("../models/reputationHistory.model");
const bcrypt = require("bcryptjs");

// Admin: lấy danh sách user
const getAllUsers = async (req, res) => {
  try {
    const { status, role, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.accountStatus = status;
    if (role) filter.role = role;
    const total = await User.countDocuments(filter);
    const users = await User.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    res.json({ success: true, data: users, total, page: Number(page), totalPages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: "Không tìm thấy người dùng" });
    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const updateUser = async (req, res) => {
  try {
    const { name, phone, avatar } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { name, phone, avatar },
      { new: true, runValidators: true }
    );
    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Đã xóa tài khoản" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Admin duyệt tài khoản
const approveUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { accountStatus: "APPROVED", rejectedReason: "" },
      { new: true }
    );
    // Gửi notification
    const { createNotification } = require("./notification.controller");
    await createNotification({
      recipientId: user._id,
      title: "Tài khoản đã được duyệt ✅",
      message: "Tài khoản của bạn đã được xác minh. Bạn có thể bắt đầu mua bán và cho thuê.",
      type: "ACCOUNT_APPROVED",
      link: "/ho-so",
    });
    res.json({ success: true, data: user, message: "Đã duyệt tài khoản" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const rejectUser = async (req, res) => {
  try {
    const { reason } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { accountStatus: "REJECTED", rejectedReason: reason || "Không đáp ứng yêu cầu" },
      { new: true }
    );
    const { createNotification } = require("./notification.controller");
    await createNotification({
      recipientId: user._id,
      title: "Tài khoản bị từ chối ❌",
      message: `Tài khoản của bạn bị từ chối. Lý do: ${reason || "Không đáp ứng yêu cầu"}`,
      type: "ACCOUNT_REJECTED",
      link: "/xac-minh-tai-khoan",
    });
    res.json({ success: true, data: user, message: "Đã từ chối tài khoản" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Admin trừ điểm uy tín + lưu lịch sử
const deductReputation = async (req, res) => {
  try {
    const { points, reason, violationType, relatedReport } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: "Không tìm thấy" });

    user.reputationScore = Math.max(0, user.reputationScore - points);
    const wasBanned = user.reputationScore === 0;
    if (wasBanned) user.accountStatus = "BANNED";
    await user.save();

    // Lưu lịch sử
    await ReputationHistory.create({
      user: user._id,
      pointsDeducted: points,
      reason,
      violationType: violationType || "minor",
      scoreAfter: user.reputationScore,
      processedBy: req.user._id,
      relatedReport: relatedReport || undefined,
    });

    // Gửi notification
    const { createNotification } = require("./notification.controller");
    await createNotification({
      recipientId: user._id,
      title: `Bị trừ ${points} điểm uy tín`,
      message: `Tài khoản của bạn bị trừ ${points} điểm uy tín. Lý do: ${reason}. Điểm còn lại: ${user.reputationScore}`,
      type: "GENERAL",
      link: "/ho-so",
    });

    res.json({ success: true, data: user, message: `Đã trừ ${points} điểm` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Lấy lịch sử uy tín
const getReputationHistory = async (req, res) => {
  try {
    const history = await ReputationHistory.find({ user: req.params.id })
      .populate("processedBy", "name")
      .sort({ createdAt: -1 });
    res.json({ success: true, data: history });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Đổi mật khẩu
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.params.id).select("+password");
    if (!user) return res.status(404).json({ success: false, message: "Không tìm thấy" });

    // Chỉ user tự đổi mật khẩu của mình
    if (user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Không có quyền" });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) return res.status(400).json({ success: false, message: "Mật khẩu hiện tại không đúng" });

    user.password = newPassword;
    await user.save();
    res.json({ success: true, message: "Đổi mật khẩu thành công" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Admin ban/unban user
const banUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { accountStatus: "BANNED" },
      { new: true }
    );
    res.json({ success: true, data: user, message: "Đã khóa tài khoản" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const unbanUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { accountStatus: "APPROVED", reputationScore: 50 }, // khôi phục 50 điểm
      { new: true }
    );
    res.json({ success: true, data: user, message: "Đã mở khóa tài khoản" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Upload CCCD
const uploadCccd = async (req, res) => {
  try {
    const { cccdImage } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { cccdImage },
      { new: true }
    );
    res.json({ success: true, data: user, message: "Đã cập nhật giấy tờ" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getAllUsers, getUserById, updateUser, deleteUser,
  approveUser, rejectUser, deductReputation,
  getReputationHistory, changePassword, banUser, unbanUser, uploadCccd,
};
