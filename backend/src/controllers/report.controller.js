const Report = require("../models/report.model");
const ReportEvidence = require("../models/report_evidence.model");
const ReputationLog = require("../models/reputation_log.model");
const { Int32 } = require("mongodb");
const User = require("../models/user.model");
const MediaFile = require("../models/media_file.model");
const ProductPost = require("../models/product_post.model");
const { attachImagesToProducts } = require("../utils/product-images.util");
const { createNotification } = require("./notification.controller");

const VIOLATION_POINTS = { warning: 10, minor: 20, major: 50 };
const ObjectId = MediaFile.db.base.Types.ObjectId;

const insertReputationLog = async (doc) => {
  try {
    return await ReputationLog.collection.insertOne(doc);
  } catch (error) {
    if (error?.code !== 121) throw error;
    await ReputationLog.db.db.command({
      collMod: "reputation_logs",
      validator: {},
      validationLevel: "off",
    });
    return ReputationLog.collection.insertOne(doc);
  }
};

const normalizeIdList = (ids) => {
  if (!Array.isArray(ids)) return [];
  return ids.map((id) => String(id || "").trim()).filter(Boolean);
};

// POST /api/reports — người dùng gửi báo cáo
const createReport = async (req, res) => {
  try {
    const { reportedUserId, orderId, rentalContractId, postId, reportType, description, evidenceMediaIds } = req.body;

    if (!reportedUserId || !reportType || !description) {
      return res.status(400).json({ success: false, message: "Thiếu thông tin bắt buộc" });
    }

    if (!ObjectId.isValid(reportedUserId)) {
      return res.status(400).json({ success: false, message: "Nguoi bi bao cao khong hop le" });
    }

    if (String(reportedUserId) === String(req.user._id)) {
      return res.status(400).json({ success: false, message: "Khong the bao cao san pham cua chinh minh" });
    }

    if (postId) {
      if (!ObjectId.isValid(postId)) {
        return res.status(400).json({ success: false, message: "San pham khong hop le" });
      }
      const product = await ProductPost.findById(postId).select("ownerId");
      if (!product) {
        return res.status(404).json({ success: false, message: "Khong tim thay san pham" });
      }
      if (String(product.ownerId) === String(req.user._id)) {
        return res.status(400).json({ success: false, message: "Khong the bao cao san pham cua chinh minh" });
      }
      if (String(product.ownerId) !== String(reportedUserId)) {
        return res.status(400).json({ success: false, message: "Thong tin nguoi bi bao cao khong khop san pham" });
      }
    }

    const mediaIds = normalizeIdList(evidenceMediaIds);
    if (mediaIds.some((mediaId) => !ObjectId.isValid(mediaId))) {
      return res.status(400).json({ success: false, message: "Bang chung khong hop le" });
    }

    if (mediaIds.length > 0) {
      const validMediaCount = await MediaFile.countDocuments({
        _id: { $in: mediaIds },
        uploadedBy: req.user._id,
      });
      if (validMediaCount !== mediaIds.length) {
        return res.status(400).json({ success: false, message: "Bang chung khong ton tai hoac khong thuoc ve ban" });
      }
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
    if (mediaIds.length > 0) {
      const now = new Date();
      const evidenceDocs = mediaIds.map((mediaId) => ({
        reportId: report._id,
        field: new ObjectId(mediaId),
        evidenceType: "image",
        createdAt: now,
      }));
      await ReportEvidence.collection.insertMany(evidenceDocs);
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
      .populate("postId", "title description productType salePrice rentPricePerDay conditionStatus location ownerId createdAt")
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
      .populate("postId", "title description productType salePrice rentPricePerDay conditionStatus location ownerId createdAt")
      .populate("orderId")
      .populate("rentalContractId")
      .populate("adminId", "fullName");

    if (!report) return res.status(404).json({ success: false, message: "Không tìm thấy báo cáo" });

    const evidences = await ReportEvidence.find({ reportId: report._id })
      .populate("mediaId", "publicUrl fileType mimeType originalName fileName fileSize createdAt")
      .populate("field", "publicUrl fileType mimeType originalName fileName fileSize createdAt");

    const data = report.toObject();
    if (data.postId?._id) {
      await attachImagesToProducts([data.postId]);
    }

    res.json({ success: true, data: { ...data, evidences } });
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

    if (["resolved", "dismissed"].includes(report.status)) {
      return res.status(409).json({ success: false, message: "Bao cao nay da duoc xu ly truoc do" });
    }
    if (report.status === status) {
      return res.json({ success: true, data: report, message: "Trang thai bao cao da duoc cap nhat truoc do" });
    }

    const previousStatus = report.status;
    const updateResult = await Report.updateOne(
      { _id: report._id, status: previousStatus },
      { $set: { status, adminNote: adminNote || null, adminId: req.user._id } }
    );
    if (updateResult.matchedCount === 0) {
      return res.status(409).json({ success: false, message: "Bao cao nay vua duoc xu ly truoc do" });
    }
    report.status = status;
    report.adminNote = adminNote || null;
    report.adminId = req.user._id;

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
        await insertReputationLog({
          userId: victim._id,
          reportId: report._id,
          changedBy: req.user._id,
          changeAmount: new Int32(-deductAmount),
          reason: adminNote || `Vi phạm mức ${violationLevel}`,
          violationLevel,
          createdAt: new Date(),
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
            link: `/ho-so`,
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
        link: `/thong-bao`,
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

const addReportEvidenceSafe = async (req, res) => {
  try {
    const mediaIds = normalizeIdList(req.body.mediaIds);

    if (mediaIds.length === 0) {
      return res.status(400).json({ success: false, message: "Can it nhat 1 bang chung" });
    }
    if (mediaIds.some((mediaId) => !ObjectId.isValid(mediaId))) {
      return res.status(400).json({ success: false, message: "Bang chung khong hop le" });
    }

    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ success: false, message: "Khong tim thay bao cao" });

    if (String(report.reporterId) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: "Khong co quyen them bang chung" });
    }

    const validMediaCount = await MediaFile.countDocuments({
      _id: { $in: mediaIds },
      uploadedBy: req.user._id,
    });
    if (validMediaCount !== mediaIds.length) {
      return res.status(400).json({ success: false, message: "Bang chung khong ton tai hoac khong thuoc ve ban" });
    }

    const now = new Date();
    const evidenceDocs = mediaIds.map((mediaId) => ({
      reportId: report._id,
      field: new ObjectId(mediaId),
      evidenceType: "image",
      createdAt: now,
    }));
    const result = await ReportEvidence.collection.insertMany(evidenceDocs);

    res.status(201).json({ success: true, data: Object.values(result.insertedIds), count: result.insertedCount });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { createReport, getAdminReports, getReportById, getMyReports, resolveReport, addReportEvidence: addReportEvidenceSafe };
