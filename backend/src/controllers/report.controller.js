const Report = require("../models/report.model");

const createReport = async (req, res) => {
  try {
    const report = await Report.create({ ...req.body, reporter: req.user._id });
    res.status(201).json({ success: true, data: report });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getAdminReports = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};
    const reports = await Report.find(filter)
      .populate("reporter", "name email")
      .populate("reportedUser", "name email")
      .populate("product", "title")
      .sort({ createdAt: -1 });
    res.json({ success: true, data: reports });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const resolveReport = async (req, res) => {
  try {
    const { status, adminNote } = req.body;
    const report = await Report.findByIdAndUpdate(
      req.params.id,
      { status, adminNote, resolvedBy: req.user._id, resolvedAt: new Date() },
      { new: true }
    ).populate("reporter", "_id");

    if (status === "RESOLVED" || status === "REJECTED") {
      const { createNotification } = require("./notification.controller");
      await createNotification({
        recipientId: report.reporter._id,
        title: "Cập nhật báo cáo vi phạm 🔔",
        message: `Báo cáo vi phạm của bạn đã được xử lý. Trạng thái: ${status}. Ghi chú: ${adminNote || "Không có"}`,
        type: "REPORT_RESOLVED",
        link: "/ho-so", // or wherever user can see their report statuses
      });
    }

    res.json({ success: true, data: report });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { createReport, getAdminReports, resolveReport };
