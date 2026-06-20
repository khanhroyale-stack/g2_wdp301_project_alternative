const Delivery = require("../models/delivery.model");
const Order = require("../models/order.model");
const DeliveryInspection = require("../models/delivery_inspection.model");
const ProductPost = require("../models/product_post.model");
const {
  getProductImageUrls,
  getProductThumbnailUrl,
} = require("../utils/product-images.util");

const appendDeliveryHistory = (delivery, status, note) => {
  delivery.history.push({
    status,
    note,
    timestamp: new Date(),
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
      deliveryStatus: "pending",
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

    res.json({ success: true, data: deliveries });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const acceptDelivery = async (req, res) => {
  try {
    const delivery = await Delivery.findById(req.params.id);

    if (!delivery) {
      return res.status(404).json({ success: false, message: "Khong tim thay don giao hang" });
    }

    if (delivery.shipperId) {
      return res.status(400).json({
        success: false,
        message: "Don nay da co shipper nhan",
      });
    }

    delivery.shipperId = req.user._id;
    delivery.deliveryStatus = "accepted";
    appendDeliveryHistory(delivery, "accepted", "Shipper da nhan don giao hang.");
    await delivery.save();

    await Order.findByIdAndUpdate(delivery.orderId, {
      orderStatus: "shipping",
    });

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

    res.json({
      success: true,
      message: "Da nhan don giao hang",
      data: updatedDelivery,
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
      filter.deliveryStatus = status;
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

    res.json({ success: true, data: deliveries });
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
      return res.status(404).json({ success: false, message: "Khong tim thay don giao hang" });
    }

    const isShipper = String(delivery.shipperId?._id) === String(req.user._id);
    const isBuyer = delivery.orderId && String(delivery.orderId.buyerId._id) === String(req.user._id);
    const isSeller = delivery.orderId && String(delivery.orderId.sellerId._id) === String(req.user._id);
    if (!isShipper && !isBuyer && !isSeller && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Ban khong co quyen xem don giao hang nay",
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

    res.json({ success: true, data: delivery });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateDeliveryStatus = async (req, res) => {
  try {
    const { status, note, failureReason } = req.body;
    const delivery = await Delivery.findById(req.params.id);

    if (!delivery) {
      return res.status(404).json({ success: false, message: "Khong tim thay don giao hang" });
    }

    if (String(delivery.shipperId) !== String(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: "Ban khong co quyen cap nhat don nay",
      });
    }

    const validTransitions = {
      accepted: ["picking_up", "failed"],
      picking_up: ["picked_up", "failed"],
      picked_up: ["in_transit", "failed"],
      in_transit: ["delivered", "failed"],
      delivered: [],
      completed: [],
      failed: [],
      pending: [],
    };

    const currentStatus = delivery.deliveryStatus;
    if (!validTransitions[currentStatus] || !validTransitions[currentStatus].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Khong the chuyen sang trang thai nay",
      });
    }

    if (status === "in_transit") {
      const latestInspection = await DeliveryInspection.findOne({ deliveryId: delivery._id }).sort({ createdAt: -1 }).lean();
      if (!latestInspection || latestInspection.result !== "passed") {
        return res.status(400).json({
          success: false,
          message: "Can co bien ban kiem tra hop le truoc khi bat dau giao hang",
        });
      }
    }

    delivery.deliveryStatus = status;
    if (status === "failed") {
      delivery.failureReason = (failureReason || note || "").trim() || "Shipper bao cao giao hang that bai.";
    }
    appendDeliveryHistory(
      delivery,
      status,
      status === "picking_up"
        ? note || "Shipper dang di den diem lay hang."
        : status === "picked_up"
          ? note || "Shipper da nhan hang tu seller va cho kiem tra."
          : status === "in_transit"
            ? note || "Shipper bat dau giao hang den buyer."
            : status === "delivered"
              ? note || "Shipper xac nhan da giao hang thanh cong."
              : delivery.failureReason || note || "Delivery gap su co va duoc danh dau that bai."
    );
    await delivery.save();

    if (status === "delivered") {
      await Order.findByIdAndUpdate(delivery.orderId, {
        orderStatus: "delivered",
      });
    } else if (status === "failed") {
      const order = await Order.findByIdAndUpdate(delivery.orderId, {
        orderStatus: "cancelled",
        cancelReason: delivery.failureReason,
      }, { new: true }).lean();

      if (order?.postId) {
        await ProductPost.findByIdAndUpdate(order.postId, {
          postStatus: "approved",
        });
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

    res.json({
      success: true,
      message: "Cap nhat trang thai thanh cong",
      data: updatedDelivery,
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
