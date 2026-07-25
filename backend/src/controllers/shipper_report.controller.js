const ShipperReport = require("../models/shipper_report.model");
const Delivery = require("../models/delivery.model");
const User = require("../models/user.model");
const { createNotification } = require("./notification.controller");

const ISSUE_TYPES = ["buyer_unavailable", "wrong_address", "seller_unavailable", "product_damaged", "vehicle_issue", "other"];

const createShipperReport = async (req, res) => {
  try {
    const { deliveryId, issueType, description } = req.body;
    if (!deliveryId || !ISSUE_TYPES.includes(issueType) || !description?.trim()) {
      return res.status(400).json({ success: false, message: "Vui lòng điền đầy đủ thông tin sự cố" });
    }

    const delivery = await Delivery.findOne({ _id: deliveryId, shipperId: req.user._id })
      .populate({
        path: "orderId",
        select: "buyerId sellerId postId",
        populate: { path: "postId", select: "title" },
      });
    if (!delivery) {
      return res.status(403).json({ success: false, message: "Bạn không phụ trách đơn giao hàng này" });
    }

    const report = await ShipperReport.create({
      deliveryId: delivery._id,
      shipperId: req.user._id,
      issueType,
      description: description.trim(),
    });

    const io = req.app.get("io");
    const admins = await User.find({ role: "admin", accountStatus: "active" }).select("_id");
    const adminNotifs = admins.map((admin) => createNotification({
      recipientId: admin._id,
      type: "report_update",
      title: "Shipper báo cáo sự cố",
      content: `Có sự cố mới cho vận đơn #${String(deliveryId).slice(-8).toUpperCase()}.`,
      relatedType: "report",
      relatedId: report._id,
      link: "/admin/bao-cao-giao-hang",
    }, io));

    const userNotifs = [];
    if (delivery.orderId) {
      const order = delivery.orderId;
      const productTitle = order.postId?.title || "sản phẩm";
      const issueLabels = {
        buyer_unavailable: "Không liên hệ được người mua",
        wrong_address: "Sai địa chỉ giao hàng",
        seller_unavailable: "Người bán không giao hàng",
        product_damaged: "Sản phẩm hư hỏng",
        vehicle_issue: "Sự cố phương tiện",
        other: "Sự cố khác",
      };
      const issueLabel = issueLabels[issueType] || "Sự cố vận chuyển";

      if (order.buyerId) {
        userNotifs.push(createNotification({
          recipientId: order.buyerId?._id || order.buyerId,
          type: "report_update",
          title: "Sự cố vận chuyển đơn hàng",
          content: `Shipper đã báo cáo sự cố "${issueLabel}" với đơn hàng "${productTitle}": "${description.trim()}". Bấm để xem chi tiết.`,
          relatedType: "order",
          relatedId: order._id,
          link: `/orders/${order._id}`,
        }, io));
      }
      if (order.sellerId) {
        userNotifs.push(createNotification({
          recipientId: order.sellerId?._id || order.sellerId,
          type: "report_update",
          title: "Sự cố vận chuyển đơn bán",
          content: `Shipper đã báo cáo sự cố "${issueLabel}" với đơn bán "${productTitle}": "${description.trim()}". Bấm để xem chi tiết.`,
          relatedType: "order",
          relatedId: order._id,
          link: `/orders/${order._id}`,
        }, io));
      }
    }

    await Promise.all([...adminNotifs, ...userNotifs]);

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
      return res.status(400).json({ success: false, message: "Trạng thái không hợp lệ" });
    }
    const report = await ShipperReport.findByIdAndUpdate(req.params.id, {
      status,
      adminNote: adminNote?.trim() || null,
      adminId: req.user._id,
    }, { new: true });
    if (!report) return res.status(404).json({ success: false, message: "Không tìm thấy báo cáo" });
    res.json({ success: true, data: report });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { createShipperReport, getMyShipperReports, getAdminShipperReports, resolveShipperReport };
