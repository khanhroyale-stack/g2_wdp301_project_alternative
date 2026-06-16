const path = require("path");
const User = require("../models/user.model");
const VerificationRequest = require("../models/verification_request.model");

// @route POST /api/verification/upload
const uploadDocs = async (req, res) => {
  try {
    if (!req.files || (!req.files.citizenId && !req.files.studentCard)) {
      return res.status(400).json({ success: false, message: "Vui lòng upload ít nhất CCCD hoặc thẻ sinh viên" });
    }

    const user = req.user;
    if (user.verificationStatus === "verified") {
      return res.status(400).json({ success: false, message: "Tài khoản đã được xác minh" });
    }

    const updates = {};
    if (req.files.citizenId) {
      updates.citizenIdUrl = `/uploads/verification/${req.files.citizenId[0].filename}`;
    }
    if (req.files.studentCard) {
      updates.studentCardUrl = `/uploads/verification/${req.files.studentCard[0].filename}`;
    }
    updates.verificationStatus = "pending";

    await User.findByIdAndUpdate(user._id, updates);

    const existing = await VerificationRequest.findOne({ userId: user._id, status: "pending" });
    if (!existing) {
      await VerificationRequest.create({ userId: user._id });
    }

    res.json({ success: true, message: "Giấy tờ đã được gửi. Vui lòng chờ admin xét duyệt." });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route GET /api/verification/status
const getMyStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select(
      "verificationStatus studentCardUrl citizenIdUrl"
    );
    const request = await VerificationRequest.findOne({ userId: req.user._id }).sort({ createdAt: -1 });

    res.json({
      success: true,
      verificationStatus: user.verificationStatus,
      studentCardUrl: user.studentCardUrl,
      citizenIdUrl: user.citizenIdUrl,
      rejectReason: request?.rejectReason || null,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route GET /api/verification/admin/list
const adminListPending = async (req, res) => {
  try {
    const { status = "pending", page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const [requests, total] = await Promise.all([
      VerificationRequest.find({ status })
        .populate("userId", "fullName email phone studentCardUrl citizenIdUrl createdAt")
        .skip(skip)
        .limit(Number(limit))
        .sort({ createdAt: -1 }),
      VerificationRequest.countDocuments({ status }),
    ]);

    res.json({ success: true, total, page: Number(page), requests });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route GET /api/verification/admin/:id
const adminGetDetail = async (req, res) => {
  try {
    const request = await VerificationRequest.findById(req.params.id).populate(
      "userId",
      "fullName email phone studentCardUrl citizenIdUrl verificationStatus createdAt"
    );
    if (!request) {
      return res.status(404).json({ success: false, message: "Không tìm thấy yêu cầu" });
    }
    res.json({ success: true, request });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route PUT /api/verification/admin/:id/approve
const adminApprove = async (req, res) => {
  try {
    const request = await VerificationRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ success: false, message: "Không tìm thấy yêu cầu" });
    }

    request.status = "approved";
    request.reviewedBy = req.user._id;
    await request.save();

    await User.findByIdAndUpdate(request.userId, { verificationStatus: "verified" });

    res.json({ success: true, message: "Đã duyệt tài khoản thành công" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route PUT /api/verification/admin/:id/reject
const adminReject = async (req, res) => {
  try {
    const { rejectReason } = req.body;
    if (!rejectReason) {
      return res.status(400).json({ success: false, message: "Vui lòng nhập lý do từ chối" });
    }

    const request = await VerificationRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ success: false, message: "Không tìm thấy yêu cầu" });
    }

    request.status = "rejected";
    request.reviewedBy = req.user._id;
    request.rejectReason = rejectReason;
    await request.save();

    await User.findByIdAndUpdate(request.userId, { verificationStatus: "rejected" });

    res.json({ success: true, message: "Đã từ chối yêu cầu xác minh" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { uploadDocs, getMyStatus, adminListPending, adminGetDetail, adminApprove, adminReject };
