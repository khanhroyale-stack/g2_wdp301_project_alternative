const User = require("../models/user.model");
const Product = require("../models/product.model");
const Order = require("../models/order.model");
const Rental = require("../models/rental.model");
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
      Product.countDocuments({}),
      Product.countDocuments({ status: "PENDING" }),
      Product.countDocuments({ status: "ACTIVE" }),
      Product.countDocuments({ status: "SOLD" }),
      Product.countDocuments({ status: "RENTING" }),
      Order.countDocuments({}),
      Order.countDocuments({ status: "COMPLETED" }),
      Order.countDocuments({ status: "CANCELLED" }),
      Order.countDocuments({ status: { $in: ["DELIVERING", "PICKING_UP", "PICKED_UP"] } }),
      Rental.countDocuments({}),
      Rental.countDocuments({ status: "ACTIVE" }),
      Rental.countDocuments({ status: "COMPLETED" }),
      Rental.countDocuments({ status: "DISPUTED" }),
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
    const { status, page = 1, limit = 20 } = req.query;
    const filter = status ? { status } : {};
    const total = await Order.countDocuments(filter);
    const orders = await Order.find(filter)
      .populate("product", "title images salePrice")
      .populate("buyer", "name email phone")
      .populate("seller", "name email phone")
      .populate("shipper", "name phone")
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
    const filter = status ? { status } : {};
    const total = await Rental.countDocuments(filter);
    const rentals = await Rental.find(filter)
      .populate("product", "title images rentalPricePerDay")
      .populate("renter", "name email phone")
      .populate("owner", "name email phone")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    res.json({ success: true, data: rentals, total, page: Number(page), totalPages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getStats, getAllOrders, getAllRentals };
