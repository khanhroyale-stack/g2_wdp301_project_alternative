const Delivery = require("../models/delivery.model");
const Order = require("../models/order.model");
const DeliveryInspection = require("../models/delivery_inspection.model");
const { createNotification } = require("./notification.controller");
const {
  getProductImageUrls,
  getProductThumbnailUrl,
} = require("../utils/product-images.util");
const { buildAvailableDeliveryClaimFilter, isDeliveryTransitionAllowed } = require("../utils/business-rules");
const { releaseOrderInventory } = require("../services/order-inventory.service");

const DELIVERY_STATUS_TO_UI = {
  WAITING_SHIPPER: "pending",
  SHIPPER_ACCEPTED: "accepted",
  PICKING_UP: "picking_up",
  PICKED_UP: "picked_up",
  DELIVERING: "in_transit",
  DELIVERED: "delivered",
  COMPLETED: "completed",
  FAILED: "failed",
};

const DELIVERY_STATUS_FROM_UI = {
  pending: "WAITING_SHIPPER",
  accepted: "SHIPPER_ACCEPTED",
  picking_up: "PICKING_UP",
  picked_up: "PICKED_UP",
  ready_for_delivery: "PICKED_UP",
  received: "PICKED_UP",
  in_transit: "DELIVERING",
  delivered: "DELIVERED",
  completed: "COMPLETED",
  inspection_failed: "FAILED",
  failed: "FAILED",
};

const ORDER_STATUS_FROM_DELIVERY_UI = {
  picking_up: "PICKING_UP",
  picked_up: "PICKED_UP",
  ready_for_delivery: "PICKED_UP",
  received: "PICKED_UP",
  in_transit: "DELIVERING",
  delivered: "DELIVERED",
  failed: "CANCELLED",
};

const getUiDeliveryStatus = (status) => DELIVERY_STATUS_TO_UI[status] || status || "pending";

const normalizeDeliveryForClient = (delivery) => {
  if (!delivery) return delivery;
  const uiStatus = getUiDeliveryStatus(delivery.status || delivery.deliveryStatus);
  return {
    ...delivery,
    status: delivery.status,
    deliveryStatus: uiStatus,
    history: (delivery.history || []).map((item) => ({
      ...item,
      status: getUiDeliveryStatus(item.status),
      timestamp: item.timestamp || item.changedAt,
    })),
  };
};

const appendDeliveryHistory = (delivery, status, note) => {
  delivery.history.push({
    status,
    note,
    changedAt: new Date(),
  });
};

const hydrateProductImage = async (delivery) => {
  if (delivery.orderId?.postId?._id) {
    delivery.orderId.productImage = await getProductThumbnailUrl(delivery.orderId.postId._id);
  }
};

const getAvailableDeliveries = async (req, res) => {
  try {
    const deliveries = await Delivery.find({
      shipperId: null,
      status: "WAITING_SHIPPER",
    })
      .populate({
        path: "orderId",
        populate: [
          { path: "buyerId", select: "fullName phone" },
          { path: "sellerId", select: "fullName phone address" },
          { path: "postId", select: "title salePrice" },
        ],
      })
      .sort({ createdAt: -1 })
      .lean();

    for (const delivery of deliveries) {
      await hydrateProductImage(delivery);
    }

    res.json({ success: true, data: deliveries.map(normalizeDeliveryForClient) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const acceptDelivery = async (req, res) => {
  try {
    const delivery = await Delivery.findOneAndUpdate(
      buildAvailableDeliveryClaimFilter(req.params.id),
      {
        $set: { shipperId: req.user._id, status: "SHIPPER_ACCEPTED" },
        $push: {
          history: {
            status: "SHIPPER_ACCEPTED",
            note: "Shipper da nhan don giao hang.",
            changedAt: new Date(),
          },
        },
      },
      { new: true }
    );

    if (!delivery) {
      const exists = await Delivery.exists({ _id: req.params.id });
      return res.status(400).json({
        success: false,
        message: exists ? "Don nay da co shipper nhan" : "Khong tim thay don giao hang",
      });
    }

    const updatedDelivery = await Delivery.findById(delivery._id)
      .populate("shipperId", "fullName phone")
      .populate({
        path: "orderId",
        populate: [
          { path: "buyerId", select: "fullName phone" },
          { path: "sellerId", select: "fullName phone address" },
          { path: "postId", select: "title salePrice" },
        ],
      })
      .lean();
    req.app.get("io")?.emit("realtime_update", { type: "delivery", relatedType: "delivery", relatedId: delivery._id });

    res.json({
      success: true,
      message: "Đã nhận đơn giao hàng",
      data: normalizeDeliveryForClient(updatedDelivery),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getMyDeliveries = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = { shipperId: req.user._id };
    if (status) {
      filter.status = DELIVERY_STATUS_FROM_UI[status] || status;
    }

    const deliveries = await Delivery.find(filter)
      .populate({
        path: "orderId",
        populate: [
          { path: "buyerId", select: "fullName phone address" },
          { path: "sellerId", select: "fullName phone address" },
          { path: "postId", select: "title salePrice" },
        ],
      })
      .sort({ createdAt: -1 })
      .lean();

    for (const delivery of deliveries) {
      await hydrateProductImage(delivery);
    }

    res.json({ success: true, data: deliveries.map(normalizeDeliveryForClient) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getDeliveryById = async (req, res) => {
  try {
    const delivery = await Delivery.findById(req.params.id)
      .populate("shipperId", "fullName phone email")
      .populate({
        path: "orderId",
        populate: [
          { path: "buyerId", select: "fullName phone address email" },
          { path: "sellerId", select: "fullName phone address email" },
          { path: "postId" },
        ],
      })
      .lean();

    if (!delivery) {
      return res.status(404).json({ success: false, message: "Không tìm thấy đơn giao hàng" });
    }

    const isShipper = String(delivery.shipperId?._id) === String(req.user._id);
    const isBuyer = delivery.orderId && String(delivery.orderId.buyerId._id) === String(req.user._id);
    const isSeller = delivery.orderId && String(delivery.orderId.sellerId._id) === String(req.user._id);
    if (!isShipper && !isBuyer && !isSeller && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền xem đơn giao hàng này",
      });
    }

    if (delivery.orderId?.postId?._id) {
      delivery.orderId.postId.images = await getProductImageUrls(delivery.orderId.postId._id);
    }

    const inspections = await DeliveryInspection.find({ deliveryId: delivery._id })
      .populate("shipperId", "fullName phone")
      .sort({ createdAt: -1 })
      .lean();
    delivery.inspections = inspections;

    res.json({ success: true, data: normalizeDeliveryForClient(delivery) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateDeliveryStatus = async (req, res) => {
  try {
    const { status, note, failureReason } = req.body;
    const io = req.app.get("io");
    const delivery = await Delivery.findById(req.params.id);

    if (!delivery) {
      return res.status(404).json({ success: false, message: "Không tìm thấy đơn giao hàng" });
    }

    if (String(delivery.shipperId) !== String(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền cập nhật đơn này",
      });
    }

    const currentStatus = getUiDeliveryStatus(delivery.status || delivery.deliveryStatus);
    if (!isDeliveryTransitionAllowed(currentStatus, status)) {
      return res.status(400).json({
        success: false,
        message: "Không thể chuyển sang trạng thái này",
      });
    }

    if (status === "in_transit") {
      const latestInspection = await DeliveryInspection.findOne({ deliveryId: delivery._id }).sort({ createdAt: -1 }).lean();
      if (!latestInspection || latestInspection.result !== "passed") {
        return res.status(400).json({
          success: false,
          message: "Cần có biên bản kiểm tra hợp lệ trước khi bắt đầu giao hàng",
        });
      }
    }

    delivery.status = DELIVERY_STATUS_FROM_UI[status] || status;
    if (status === "failed") {
      delivery.failureReason = (failureReason || note || "").trim() || "Shipper bao cao giao hang that bai.";
    }
    appendDeliveryHistory(
      delivery,
      delivery.status,
      status === "picking_up"
        ? note || "Shipper dang di den diem lay hang."
        : status === "ready_for_delivery" || status === "picked_up"
          ? note || "Shipper da lay hang tu seller va can lap bien ban kiem tra."
          : status === "received"
            ? note || "San pham da kiem tra dat va shipper da nhan hang hop le."
          : status === "in_transit"
            ? note || "Shipper bat dau giao hang den buyer."
            : status === "delivered"
              ? note || "Shipper xac nhan da giao hang thanh cong."
              : status === "inspection_failed"
                ? note || "Bien ban kiem tra that bai. Delivery dung de Admin xu ly."
                : delivery.failureReason || note || "Delivery gap su co va duoc danh dau that bai."
    );
    await delivery.save();

    if (["picking_up", "picked_up", "ready_for_delivery", "received", "in_transit"].includes(status)) {
      await Order.findByIdAndUpdate(delivery.orderId, {
        status: ORDER_STATUS_FROM_DELIVERY_UI[status],
      });
    } else if (status === "delivered") {
      const order = await Order.findByIdAndUpdate(delivery.orderId, {
        status: ORDER_STATUS_FROM_DELIVERY_UI[status],
      }, { new: true })
        .populate("buyerId", "fullName")
        .populate("sellerId", "fullName")
        .populate("postId", "title")
        .lean();

      if (order) {
        const productTitle = order.postId?.title || "sản phẩm";
        await Promise.all([
          createNotification({
            recipientId: order.buyerId?._id || order.buyerId,
            type: "order_update",
            title: "Đơn hàng đã được giao",
            content: `Shipper đã xác nhận giao thành công "${productTitle}". Vui lòng kiểm tra hàng và xác nhận hoàn tất đơn.`,
            relatedType: "order",
            relatedId: order._id,
            link: `/orders/${order._id}`,
          }, io),
          createNotification({
            recipientId: order.sellerId?._id || order.sellerId,
            type: "order_update",
            title: "Đơn bán đã giao thành công",
            content: `Shipper đã xác nhận giao thành công "${productTitle}". Hệ thống đang chờ người mua xác nhận hoàn tất.`,
            relatedType: "order",
            relatedId: order._id,
            link: `/orders/${order._id}`,
          }, io),
        ]);
      }
    } else if (status === "failed") {
      const order = await Order.findByIdAndUpdate(delivery.orderId, {
        status: ORDER_STATUS_FROM_DELIVERY_UI[status],
        cancelReason: delivery.failureReason,
      }, { new: true })
        .populate("buyerId", "fullName")
        .populate("sellerId", "fullName")
        .populate("postId", "title")
        .lean();

      if (order?.postId) {
        await releaseOrderInventory(delivery.orderId);
      }

      if (order) {
        const productTitle = order.postId?.title || "sản phẩm";
        await Promise.all([
          createNotification({
            recipientId: order.buyerId?._id || order.buyerId,
            type: "order_update",
            title: "Đơn hàng đã bị hủy",
            content: `Vận đơn giao "${productTitle}" đã bị hủy do sự cố từ Shipper: "${delivery.failureReason}". Bấm vào đây để xem chi tiết.`,
            relatedType: "order",
            relatedId: order._id,
            link: `/orders/${order._id}`,
          }, io),
          createNotification({
            recipientId: order.sellerId?._id || order.sellerId,
            type: "order_update",
            title: "Đơn bán đã bị hủy",
            content: `Vận đơn giao "${productTitle}" đã bị hủy do sự cố từ Shipper: "${delivery.failureReason}". Sản phẩm đã được hoàn lại vào kho.`,
            relatedType: "order",
            relatedId: order._id,
            link: `/orders/${order._id}`,
          }, io),
        ]);
      }
    }

    const updatedDelivery = await Delivery.findById(delivery._id)
      .populate("shipperId", "fullName phone")
      .populate({
        path: "orderId",
        populate: [
          { path: "buyerId", select: "fullName phone" },
          { path: "sellerId", select: "fullName phone" },
          { path: "postId", select: "title" },
        ],
      })
      .lean();
    io?.emit("realtime_update", { type: "delivery", relatedType: "delivery", relatedId: delivery._id });
    io?.emit("realtime_update", { type: "order", relatedType: "order", relatedId: delivery.orderId });

    res.json({
      success: true,
      message: "Cập nhật trạng thái thành công",
      data: normalizeDeliveryForClient(updatedDelivery),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAvailableDeliveries,
  acceptDelivery,
  getMyDeliveries,
  getDeliveryById,
  updateDeliveryStatus,
};
