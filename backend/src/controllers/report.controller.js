const Report = require("../models/report.model");
const ReportEvidence = require("../models/report_evidence.model");
const ReputationLog = require("../models/reputation_log.model");
const User = require("../models/user.model");
const MediaFile = require("../models/media_file.model");
const { createNotification } = require("./notification.controller");

const VIOLATION_POINTS = { warning: 10, minor: 20, major: 50 };

// POST /api/reports — người dùng gửi báo cáo
const createReport = async (req, res) => {
  try {
    const { reportedUserId, orderId, rentalContractId, postId, reportType, description, evidenceMediaIds } = req.body;

    if (!reportedUserId || !reportType || !description) {
      return res.status(400).json({ success: false, message: "Thiếu thông tin bắt buộc" });
    }

    const report = await Report.create({
      reporterId: req.user._id,
      reportedUserId,
      orderId: orderId || null,
      rentalContractId: rentalContractId || null,
      postId: postId || null,
      reportType,
      description,
      status: "pending",
    });

    // Lưu bằng chứng nếu có (mảng mediaId từ upload trước)
    if (Array.isArray(evidenceMediaIds) && evidenceMediaIds.length > 0) {
      const evidenceDocs = evidenceMediaIds.map((mediaId) => ({
        reportId: report._id,
        mediaId,
        evidenceType: "image",
      }));
      await ReportEvidence.insertMany(evidenceDocs);
    }

    // Thông báo cho Admin (type: report_update)
    const io = req.app.get("io");
    const admins = await User.find({ role: "admin" }).select("_id");
    await Promise.all(
      admins.map((admin) =>
        createNotification(
          {
            recipientId: admin._id,
            type: "report_update",
            title: "Báo cáo vi phạm mới",
            content: `Có báo cáo vi phạm mới cần xử lý. Loại: ${reportType}.`,
            relatedType: "report",
            relatedId: report._id,
            link: `/admin/bao-cao`,
          },
          io
        )
      )
    );

    res.status(201).json({ success: true, data: report });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/reports — admin xem danh sách (có filter status)
const getAdminReports = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = status ? { status } : {};

    const total = await Report.countDocuments(filter);
    const reports = await Report.find(filter)
      .populate("reporterId", "fullName email avatarUrl")
      .populate("reportedUserId", "fullName email reputationScore")
      .populate("postId", "title images")
      .populate("orderId", "totalAmount")
      .populate("rentalContractId", "totalAmount")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ success: true, data: reports, total, page: Number(page), totalPages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/reports/:id — xem chi tiết 1 báo cáo (kèm evidence)
const getReportById = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate("reporterId", "fullName email avatarUrl phone")
      .populate("reportedUserId", "fullName email reputationScore accountStatus")
      .populate("postId", "title images")
      .populate("orderId")
      .populate("rentalContractId")
      .populate("adminId", "fullName");

    if (!report) return res.status(404).json({ success: false, message: "Không tìm thấy báo cáo" });

    const evidences = await ReportEvidence.find({ reportId: report._id })
      .populate("mediaId", "publicUrl fileType");

    res.json({ success: true, data: { ...report.toObject(), evidences } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/reports/my — user xem báo cáo của mình
const getMyReports = async (req, res) => {
  try {
    const reports = await Report.find({ reporterId: req.user._id })
      .populate("reportedUserId", "fullName")
      .sort({ createdAt: -1 });
    res.json({ success: true, data: reports });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /api/reports/:id/resolve — admin xử lý (resolved / dismissed)
const resolveReport = async (req, res) => {
  try {
    const { status, adminNote, violationLevel } = req.body;

    if (!["resolved", "dismissed", "investigating"].includes(status)) {
      return res.status(400).json({ success: false, message: "Status không hợp lệ" });
    }

    const report = await Report.findById(req.params.id)
      .populate("reporterId", "_id fullName")
      .populate("reportedUserId", "_id fullName reputationScore");

    if (!report) return res.status(404).json({ success: false, message: "Không tìm thấy báo cáo" });

    report.status = status;
    report.adminNote = adminNote || null;
    report.adminId = req.user._id;
    await report.save();

    const io = req.app.get("io");

    // Nếu resolved + có mức vi phạm → trừ điểm uy tín
    if (status === "resolved" && violationLevel && VIOLATION_POINTS[violationLevel]) {
      const deductAmount = VIOLATION_POINTS[violationLevel];
      const victim = await User.findById(report.reportedUserId._id);

      if (victim) {
        victim.reputationScore = Math.max(0, victim.reputationScore - deductAmount);
        if (victim.reputationScore === 0) victim.accountStatus = "banned";
        await victim.save();

        // Ghi log trừ điểm
        await ReputationLog.create({
          userId: victim._id,
          reportId: report._id,
          changedBy: req.user._id,
          changeAmount: -deductAmount,
          reason: adminNote || `Vi phạm mức ${violationLevel}`,
          violationLevel,
        });

        // Notify người bị báo cáo
        await createNotification(
          {
            recipientId: victim._id,
            type: "report_update",
            title: `Tài khoản bị trừ ${deductAmount} điểm uy tín`,
            content: `Lý do: ${adminNote || `Vi phạm mức ${violationLevel}`}. Điểm còn lại: ${victim.reputationScore}.${victim.accountStatus === "banned" ? " Tài khoản đã bị khóa." : ""}`,
            relatedType: "report",
            relatedId: report._id,
            link: `/reputation`,
          },
          io
        );
      }
    }

    // Notify người báo cáo
    const statusLabel = { resolved: "đã được giải quyết", dismissed: "đã bị từ chối", investigating: "đang điều tra" };
    await createNotification(
      {
        recipientId: report.reporterId._id,
        type: "report_update",
        title: "Cập nhật báo cáo vi phạm",
        content: `Báo cáo của bạn ${statusLabel[status] || status}. ${adminNote ? `Ghi chú: ${adminNote}` : ""}`,
        relatedType: "report",
        relatedId: report._id,
        link: `/reports/${report._id}`,
      },
      io
    );

    res.json({ success: true, data: report });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/reports/:id/evidence — user đính kèm bằng chứng (ảnh/video) sau khi tạo báo cáo
const addReportEvidence = async (req, res) => {
  try {
    const { mediaIds } = req.body; // mảng mediaId từ upload trước

    if (!Array.isArray(mediaIds) || mediaIds.length === 0) {
      return res.status(400).json({ success: false, message: "Cần ít nhất 1 bằng chứng" });
    }

    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ success: false, message: "Không tìm thấy báo cáo" });

    // Chỉ người báo cáo mới được thêm evidence
    if (String(report.reporterId) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: "Không có quyền thêm bằng chứng" });
    }

    const evidenceDocs = mediaIds.map((mediaId) => ({
      reportId: report._id,
      mediaId,
      evidenceType: "image",
    }));
    const created = await ReportEvidence.insertMany(evidenceDocs);

    res.status(201).json({ success: true, data: created, count: created.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { createReport, getAdminReports, getReportById, getMyReports, resolveReport, addReportEvidence };
