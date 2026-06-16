const User = require("../models/user.model");
const ReputationLog = require("../models/reputation_log.model");

const VIOLATION_POINTS = { warning: 10, minor: 20, major: 50 };

// @route GET /api/reputation/me
const getMyReputation = async (req, res) => {
  try {
    const logs = await ReputationLog.find({ userId: req.user._id })
      .populate("changedBy", "fullName")
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({
      success: true,
      reputationScore: req.user.reputationScore,
      logs,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route GET /api/reputation/:userId  (public)
const getUserReputation = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select("fullName reputationScore accountStatus");
    if (!user) {
      return res.status(404).json({ success: false, message: "Không tìm thấy người dùng" });
    }
    res.json({ success: true, reputationScore: user.reputationScore, accountStatus: user.accountStatus });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route POST /api/reputation/admin/deduct
const adminDeduct = async (req, res) => {
  try {
    const { userId, violationLevel, reason, reportId } = req.body;

    if (!userId || !violationLevel || !reason) {
      return res.status(400).json({ success: false, message: "Thiếu thông tin bắt buộc" });
    }

    const deductAmount = VIOLATION_POINTS[violationLevel];
    if (!deductAmount) {
      return res.status(400).json({ success: false, message: "Mức vi phạm không hợp lệ (warning/minor/major)" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "Không tìm thấy người dùng" });
    }

    user.reputationScore = Math.max(0, user.reputationScore - deductAmount);
    if (user.reputationScore === 0) {
      user.accountStatus = "banned";
    }
    await user.save();

    await ReputationLog.create({
      userId,
      reportId: reportId || null,
      changedBy: req.user._id,
      changeAmount: -deductAmount,
      reason,
      violationLevel,
    });

    res.json({
      success: true,
      message: `Đã trừ ${deductAmount} điểm${user.accountStatus === "banned" ? ". Tài khoản đã bị khóa do điểm = 0." : ""}`,
      reputationScore: user.reputationScore,
      accountStatus: user.accountStatus,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route GET /api/reputation/admin/:userId/history
const adminGetHistory = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select("fullName reputationScore accountStatus");
    if (!user) {
      return res.status(404).json({ success: false, message: "Không tìm thấy người dùng" });
    }

    const logs = await ReputationLog.find({ userId: req.params.userId })
      .populate("changedBy", "fullName")
      .populate("reportId", "reportType description")
      .sort({ createdAt: -1 });

    res.json({ success: true, user, logs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getMyReputation, getUserReputation, adminDeduct, adminGetHistory };
