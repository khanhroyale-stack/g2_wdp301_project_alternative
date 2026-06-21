const User = require("../models/user.model");
const ProductPost = require("../models/product_post.model");
const Order = require("../models/order.model");
const RentalContract = require("../models/rental_contract.model");
const Report = require("../models/report.model");
const Review = require("../models/review.model");
const ReputationLog = require("../models/reputation_log.model");
const { attachImagesToProducts } = require("../utils/product-images.util");

// GET /api/admin/stats — thống kê tổng quan
const getStats = async (req, res) => {
  try {
    const [
      totalUsers,
      pendingVerifyUsers,
      verifiedUsers,
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
      disputedRentals,
      totalReports,
      pendingReports,
      resolvedReports,
      totalShippers,
      totalReviews,
    ] = await Promise.all([
      User.countDocuments({}),
      User.countDocuments({ verificationStatus: "pending" }),
      User.countDocuments({ verificationStatus: "verified" }),
      User.countDocuments({ accountStatus: "banned" }),
      ProductPost.countDocuments({}),
      ProductPost.countDocuments({ postStatus: "pending" }),
      ProductPost.countDocuments({ postStatus: "approved" }),
      Order.countDocuments({}),
      Order.countDocuments({ orderStatus: "completed" }),
      Order.countDocuments({ orderStatus: "cancelled" }),
      RentalContract.countDocuments({}),
      RentalContract.countDocuments({ contractStatus: "active" }),
      RentalContract.countDocuments({ contractStatus: "completed" }),
      RentalContract.countDocuments({ contractStatus: "disputed" }),
      Report.countDocuments({}),
      Report.countDocuments({ status: "pending" }),
      Report.countDocuments({ status: "resolved" }),
      User.countDocuments({ role: "shipper" }),
      Review.countDocuments({}),
    ]);

    res.json({
      success: true,
      data: {
        users: { total: totalUsers, pendingVerify: pendingVerifyUsers, verified: verifiedUsers, banned: bannedUsers },
        products: { total: totalProducts, pending: pendingProducts, active: activeProducts },
        orders: { total: totalOrders, completed: completedOrders, cancelled: cancelledOrders },
        rentals: { total: totalRentals, active: activeRentals, completed: completedRentals, disputed: disputedRentals },
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
    const filter = orderStatus ? { orderStatus } : {};
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

    res.json({ success: true, data: orders, total, page: Number(page), totalPages: Math.ceil(total / limit) });
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
      .limit(Number(limit));
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

module.exports = { getStats, getAllOrders, getAllRentals, getAllReputationLogs };
