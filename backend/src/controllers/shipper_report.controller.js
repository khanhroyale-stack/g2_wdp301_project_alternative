const ShipperReport = require("../models/shipper_report.model");
const Delivery = require("../models/delivery.model");
const User = require("../models/user.model");
const { createNotification } = require("./notification.controller");

const ISSUE_TYPES = ["buyer_unavailable", "wrong_address", "seller_unavailable", "product_damaged", "vehicle_issue", "other"];

const createShipperReport = async (req, res) => {
  try {
    const { deliveryId, issueType, description } = req.body;
    if (!deliveryId || !ISSUE_TYPES.includes(issueType) || !description?.trim()) {
      return res.status(400).json({ success: false, message: "Vui long dien day du thong tin su co" });
    }

    const delivery = await Delivery.findOne({ _id: deliveryId, shipperId: req.user._id });
    if (!delivery) {
      return res.status(403).json({ success: false, message: "Ban khong phu trach don giao hang nay" });
    }

    const report = await ShipperReport.create({
      deliveryId,
      shipperId: req.user._id,
      issueType,
      description: description.trim(),
    });

    const admins = await User.find({ role: "admin", accountStatus: "active" }).select("_id");
    await Promise.all(admins.map((admin) => createNotification({
      recipientId: admin._id,
      type: "report_update",
      title: "Shipper báo cáo sự cố",
      content: `Có sự cố mới cho vận đơn #${String(deliveryId).slice(-8).toUpperCase()}.`,
      relatedType: "report",
      relatedId: report._id,
      link: "/admin/bao-cao-giao-hang",
    }, req.app.get("io"))));

    res.status(201).json({ success: true, data: report });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getMyShipperReports = async (req, res) => {
  try {
    const reports = await ShipperReport.find({ shipperId: req.user._id })
      .populate("deliveryId", "deliveryStatus pickupAddress deliveryAddress")
      .sort({ createdAt: -1 })
      .lean();
    res.json({ success: true, data: reports });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getAdminShipperReports = async (req, res) => {
  try {
    const filter = req.query.status ? { status: req.query.status } : {};
    const reports = await ShipperReport.find(filter)
      .populate("shipperId", "fullName email phone")
      .populate({ path: "deliveryId", populate: { path: "orderId", select: "recipientName buyerPhone" } })
      .sort({ createdAt: -1 })
      .lean();
    res.json({ success: true, data: reports });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const resolveShipperReport = async (req, res) => {
  try {
    const { status, adminNote } = req.body;
    if (!["investigating", "resolved", "dismissed"].includes(status)) {
      return res.status(400).json({ success: false, message: "Trang thai khong hop le" });
    }
    const report = await ShipperReport.findByIdAndUpdate(req.params.id, {
      status,
      adminNote: adminNote?.trim() || null,
      adminId: req.user._id,
    }, { new: true });
    if (!report) return res.status(404).json({ success: false, message: "Khong tim thay bao cao" });
    res.json({ success: true, data: report });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { createShipperReport, getMyShipperReports, getAdminShipperReports, resolveShipperReport };
