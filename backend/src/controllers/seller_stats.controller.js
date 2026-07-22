const Order = require("../models/order.model");
const RentalContract = require("../models/rental_contract.model");

// Đơn đang trong quá trình xử lý (chưa hoàn tất, chưa hủy) — doanh thu "sắp tới"
const PENDING_ORDER_STATUSES = [
  "PENDING",
  "SELLER_CONFIRMED",
  "PICKING_UP",
  "PICKED_UP",
  "DELIVERING",
  "DELIVERED",
];

const orderRevenueExpr = { $multiply: ["$productPrice", "$quantity"] };

// Khung 12 tháng gần nhất (kể cả tháng chưa có doanh thu) để biểu đồ liền mạch
const buildMonthlySkeleton = () => {
  const months = [];
  const now = new Date();
  for (let i = 11; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    months.push({
      key: `${year}-${String(month).padStart(2, "0")}`,
      label: `T${month}`,
      year,
      month,
      sales: 0,
      rental: 0,
      total: 0,
    });
  }
  return months;
};

// GET /api/seller/stats — thống kê doanh thu của người bán hiện tại
const getSellerStats = async (req, res) => {
  try {
    const sellerId = req.user._id;
    const since = new Date();
    since.setMonth(since.getMonth() - 11);
    since.setDate(1);
    since.setHours(0, 0, 0, 0);

    const [
      salesAgg,
      rentalAgg,
      pendingAgg,
      salesMonthly,
      rentalMonthly,
    ] = await Promise.all([
      // Tổng doanh thu bán (đơn đã hoàn tất)
      Order.aggregate([
        { $match: { sellerId, status: "COMPLETED" } },
        { $group: { _id: null, revenue: { $sum: orderRevenueExpr }, count: { $sum: 1 } } },
      ]),
      // Tổng doanh thu cho thuê (hợp đồng đã hoàn tất)
      RentalContract.aggregate([
        { $match: { ownerId: sellerId, contractStatus: "completed" } },
        { $group: { _id: null, revenue: { $sum: "$rentalFee" }, count: { $sum: 1 } } },
      ]),
      // Doanh thu đang xử lý (đơn bán chưa hoàn tất / chưa hủy)
      Order.aggregate([
        { $match: { sellerId, status: { $in: PENDING_ORDER_STATUSES } } },
        { $group: { _id: null, revenue: { $sum: orderRevenueExpr }, count: { $sum: 1 } } },
      ]),
      // Doanh thu bán theo tháng (12 tháng gần nhất)
      Order.aggregate([
        { $match: { sellerId, status: "COMPLETED", createdAt: { $gte: since } } },
        {
          $group: {
            _id: { y: { $year: "$createdAt" }, m: { $month: "$createdAt" } },
            revenue: { $sum: orderRevenueExpr },
          },
        },
      ]),
      // Doanh thu thuê theo tháng (12 tháng gần nhất)
      RentalContract.aggregate([
        { $match: { ownerId: sellerId, contractStatus: "completed", createdAt: { $gte: since } } },
        {
          $group: {
            _id: { y: { $year: "$createdAt" }, m: { $month: "$createdAt" } },
            revenue: { $sum: "$rentalFee" },
          },
        },
      ]),
    ]);

    const salesRevenue = salesAgg[0]?.revenue || 0;
    const salesCount = salesAgg[0]?.count || 0;
    const rentalRevenue = rentalAgg[0]?.revenue || 0;
    const rentalCount = rentalAgg[0]?.count || 0;
    const pendingRevenue = pendingAgg[0]?.revenue || 0;
    const pendingCount = pendingAgg[0]?.count || 0;

    const totalRevenue = salesRevenue + rentalRevenue;
    const totalCount = salesCount + rentalCount;
    const avgOrderValue = totalCount > 0 ? Math.round(totalRevenue / totalCount) : 0;

    // Ghép dữ liệu theo tháng vào khung 12 tháng
    const monthly = buildMonthlySkeleton();
    const monthIndex = new Map(monthly.map((item, idx) => [`${item.year}-${item.month}`, idx]));
    const applyMonthly = (rows, field) => {
      for (const row of rows) {
        const idx = monthIndex.get(`${row._id.y}-${row._id.m}`);
        if (idx !== undefined) {
          monthly[idx][field] += row.revenue || 0;
          monthly[idx].total += row.revenue || 0;
        }
      }
    };
    applyMonthly(salesMonthly, "sales");
    applyMonthly(rentalMonthly, "rental");

    res.json({
      success: true,
      data: {
        summary: {
          totalRevenue,
          totalCount,
          avgOrderValue,
          salesRevenue,
          salesCount,
          rentalRevenue,
          rentalCount,
          pendingRevenue,
          pendingCount,
        },
        monthly,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getSellerStats };
