const User = require("../models/user.model");
const ProductPost = require("../models/product_post.model");
const Order = require("../models/order.model");
const RentalContract = require("../models/rental_contract.model");
const Report = require("../models/report.model");
const Review = require("../models/review.model");
const ReputationLog = require("../models/reputation_log.model");
const Delivery = require("../models/delivery.model");
const DeliveryInspection = require("../models/delivery_inspection.model");
const InspectionImage = require("../models/inspection_image.model");
const { attachImagesToProducts } = require("../utils/product-images.util");

const ORDER_STATUS_TO_UI = {
  PENDING: "pending",
  SELLER_CONFIRMED: "confirmed",
  PICKING_UP: "shipping",
  PICKED_UP: "shipping",
  DELIVERING: "shipping",
  DELIVERED: "delivered",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
};

const getOrderStatusFilter = (status) => {
  if (!status) return {};
  if (status === "shipping") {
    return { status: { $in: ["PICKING_UP", "PICKED_UP", "DELIVERING"] } };
  }
  const map = {
    pending: "PENDING",
    confirmed: "SELLER_CONFIRMED",
    delivered: "DELIVERED",
    completed: "COMPLETED",
    cancelled: "CANCELLED",
  };
  return { status: map[status] || status };
};

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

const getUiOrderStatus = (status) => ORDER_STATUS_TO_UI[status] || status || "pending";
const getUiDeliveryStatus = (status) => DELIVERY_STATUS_TO_UI[status] || status || "pending";
const normalizeOrderForClient = (order) => ({ ...order, orderStatus: getUiOrderStatus(order.status || order.orderStatus) });
const normalizeDeliveryForClient = (delivery) => ({ ...delivery, deliveryStatus: getUiDeliveryStatus(delivery.status || delivery.deliveryStatus) });

// GET /api/admin/stats — thống kê tổng quan
const getStats = async (req, res) => {
  try {
    const [
      totalUsers,
      bannedUsers,
      totalProducts,
      pendingProducts,
      activeProducts,
      totalOrders,
      completedOrders,
      cancelledOrders,
      totalRentals,
      activeRentals,
      completedRentals,
      totalReports,
      pendingReports,
      resolvedReports,
      totalShippers,
      totalReviews,
    ] = await Promise.all([
      User.countDocuments({}),
      User.countDocuments({ accountStatus: "banned" }),
      ProductPost.countDocuments({}),
      ProductPost.countDocuments({ postStatus: "pending" }),
      ProductPost.countDocuments({ postStatus: { $in: ["approved", "available"] } }),
      Order.countDocuments({}),
      Order.countDocuments({ status: "COMPLETED" }),
      Order.countDocuments({ status: "CANCELLED" }),
      RentalContract.countDocuments({}),
      RentalContract.countDocuments({ contractStatus: "active" }),
      RentalContract.countDocuments({ contractStatus: "completed" }),
      Report.countDocuments({}),
      Report.countDocuments({ status: "pending" }),
      Report.countDocuments({ status: "resolved" }),
      User.countDocuments({ role: "shipper" }),
      Review.countDocuments({}),
    ]);

    res.json({
      success: true,
      data: {
        users: { total: totalUsers, banned: bannedUsers },
        products: { total: totalProducts, pending: pendingProducts, active: activeProducts },
        orders: { total: totalOrders, completed: completedOrders, cancelled: cancelledOrders },
        rentals: { total: totalRentals, active: activeRentals, completed: completedRentals },
        reports: { total: totalReports, pending: pendingReports, resolved: resolvedReports },
        shippers: { total: totalShippers },
        reviews: { total: totalReviews },
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/admin/orders — admin xem tất cả đơn hàng
const getAllOrders = async (req, res) => {
  try {
    const { orderStatus, page = 1, limit = 20 } = req.query;
    const filter = getOrderStatusFilter(orderStatus);
    const total = await Order.countDocuments(filter);
    const orders = await Order.find(filter)
      .populate("postId", "title salePrice")
      .populate("buyerId", "fullName email phone")
      .populate("sellerId", "fullName email phone")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .lean();

    const products = orders
      .map((order) => order.postId)
      .filter(Boolean);
    await attachImagesToProducts(products);

    res.json({ success: true, data: orders.map(normalizeOrderForClient), total, page: Number(page), totalPages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/admin/rentals — admin xem tất cả hợp đồng thuê
const getAllRentals = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = status ? { contractStatus: status } : {};
    const total = await RentalContract.countDocuments(filter);
    const rentals = await RentalContract.find(filter)
      .populate("postId", "title rentPricePerDay")
      .populate("renterId", "fullName email phone")
      .populate("ownerId", "fullName email phone")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .lean();

    const products = rentals
      .map((rental) => rental.postId)
      .filter(Boolean);
    await attachImagesToProducts(products);

    res.json({ success: true, data: rentals, total, page: Number(page), totalPages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/admin/reputation-logs — lịch sử trừ điểm toàn hệ thống
const getAllReputationLogs = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const total = await ReputationLog.countDocuments({});
    const logs = await ReputationLog.find({})
      .populate("userId", "fullName email reputationScore")
      .populate("changedBy", "fullName")
      .populate("reportId", "reportType")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    res.json({ success: true, data: logs, total, page: Number(page), totalPages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getShippers = async (req, res) => {
  try {
    const shippers = await User.find({ role: "shipper" })
      .select("fullName email phone accountStatus reputationScore createdAt")
      .sort({ createdAt: -1 })
      .lean();
    const counts = await Delivery.aggregate([
      { $match: { shipperId: { $ne: null } } },
      { $group: { _id: "$shipperId", total: { $sum: 1 }, completed: { $sum: { $cond: [{ $in: ["$status", ["DELIVERED", "COMPLETED"]] }, 1, 0] } }, failed: { $sum: { $cond: [{ $eq: ["$status", "FAILED"] }, 1, 0] } } } },
    ]);
    const countMap = new Map(counts.map((item) => [String(item._id), item]));
    res.json({ success: true, data: shippers.map((shipper) => ({ ...shipper, deliveryStats: countMap.get(String(shipper._id)) || { total: 0, completed: 0, failed: 0 } })) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getAllDeliveries = async (req, res) => {
  try {
    const filter = req.query.status ? { status: DELIVERY_STATUS_FROM_UI[req.query.status] || req.query.status } : {};
    const deliveries = await Delivery.find(filter)
      .populate("shipperId", "fullName email phone")
      .populate({ path: "orderId", populate: [{ path: "buyerId", select: "fullName" }, { path: "sellerId", select: "fullName" }, { path: "postId", select: "title" }] })
      .sort({ createdAt: -1 })
      .lean();
    res.json({ success: true, data: deliveries.map(normalizeDeliveryForClient) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getAllInspections = async (req, res) => {
  try {
    const filter = req.query.result ? { result: req.query.result } : {};
    const inspections = await DeliveryInspection.find(filter)
      .populate("shipperId", "fullName email phone")
      .populate({ path: "deliveryId", populate: { path: "orderId", populate: { path: "postId", select: "title" } } })
      .sort({ createdAt: -1 })
      .lean();
    const inspectionIds = inspections.map((inspection) => inspection._id);
    const images = await InspectionImage.find({ inspectionId: { $in: inspectionIds } })
      .populate("mediaId", "publicUrl")
      .lean();
    const imagesByInspection = images.reduce((result, image) => {
      const key = String(image.inspectionId);
      if (!result[key]) result[key] = [];
      result[key].push({ imageType: image.imageType, imageUrl: image.mediaId?.publicUrl || null });
      return result;
    }, {});
    inspections.forEach((inspection) => { inspection.images = imagesByInspection[String(inspection._id)] || []; });
    res.json({ success: true, data: inspections });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getStats, getAllOrders, getAllRentals, getAllReputationLogs, getShippers, getAllDeliveries, getAllInspections };
