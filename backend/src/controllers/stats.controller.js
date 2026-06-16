const User = require("../models/user.model");
const ProductPost = require("../models/product_post.model");
const Order = require("../models/order.model");
const RentalContract = require("../models/rental_contract.model");
const Report = require("../models/report.model");

// GET /api/admin/stats
const getStats = async (req, res) => {
  try {
    const [
      totalUsers,
      pendingUsers,
      approvedUsers,
      bannedUsers,
      totalProducts,
      pendingProducts,
      activeProducts,
      soldProducts,
      rentingProducts,
      totalOrders,
      completedOrders,
      cancelledOrders,
      deliveringOrders,
      totalRentals,
      activeRentals,
      completedRentals,
      disputedRentals,
      totalReports,
      pendingReports,
      resolvedReports,
      totalShippers,
    ] = await Promise.all([
      User.countDocuments({}),
      User.countDocuments({ accountStatus: "PENDING" }),
      User.countDocuments({ accountStatus: "APPROVED" }),
      User.countDocuments({ accountStatus: "BANNED" }),
      ProductPost.countDocuments({}),
      ProductPost.countDocuments({ postStatus: "pending" }),
      ProductPost.countDocuments({ postStatus: "approved" }),
      ProductPost.countDocuments({ postStatus: "closed" }),
      ProductPost.countDocuments({ postStatus: "closed" }), // or renting if added
      Order.countDocuments({}),
      Order.countDocuments({ status: "COMPLETED" }),
      Order.countDocuments({ status: "CANCELLED" }),
      Order.countDocuments({ status: { $in: ["DELIVERING", "PICKING_UP", "PICKED_UP"] } }),
      RentalContract.countDocuments({}),
      RentalContract.countDocuments({ contractStatus: "active" }),
      RentalContract.countDocuments({ contractStatus: "completed" }),
      RentalContract.countDocuments({ contractStatus: "disputed" }),
      Report.countDocuments({}),
      Report.countDocuments({ status: "PENDING" }),
      Report.countDocuments({ status: "RESOLVED" }),
      User.countDocuments({ role: "shipper" }),
    ]);

    res.json({
      success: true,
      data: {
        users: { total: totalUsers, pending: pendingUsers, approved: approvedUsers, banned: bannedUsers },
        products: { total: totalProducts, pending: pendingProducts, active: activeProducts, sold: soldProducts, renting: rentingProducts },
        orders: { total: totalOrders, completed: completedOrders, cancelled: cancelledOrders, delivering: deliveringOrders },
        rentals: { total: totalRentals, active: activeRentals, completed: completedRentals, disputed: disputedRentals },
        reports: { total: totalReports, pending: pendingReports, resolved: resolvedReports },
        shippers: { total: totalShippers },
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/admin/orders - Quản lý tất cả đơn hàng
const getAllOrders = async (req, res) => {
  try {
    const { orderStatus, page = 1, limit = 20 } = req.query;
    const filter = orderStatus ? { orderStatus } : {};
    const total = await Order.countDocuments(filter);
    const orders = await Order.find(filter)
      .populate("postId", "title rentPricePerDay salePrice")
      .populate("buyerId", "name email phone")
      .populate("sellerId", "name email phone")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    res.json({ success: true, data: orders, total, page: Number(page), totalPages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/admin/rentals - Quản lý tất cả hợp đồng thuê
const getAllRentals = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = status ? { contractStatus: status } : {};
    const total = await RentalContract.countDocuments(filter);
    const rentals = await RentalContract.find(filter)
      .populate("postId", "title rentPricePerDay")
      .populate("renterId", "name email phone")
      .populate("ownerId", "name email phone")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    res.json({ success: true, data: rentals, total, page: Number(page), totalPages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getStats, getAllOrders, getAllRentals };
