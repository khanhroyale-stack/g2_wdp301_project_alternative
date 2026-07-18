const ProSubscription = require("../models/pro_subscription.model");

const VALID_STATUSES = ["pending", "paid", "failed", "cancelled"];
const VALID_PLANS = ["1m", "3m", "12m"];

const parsePositiveInt = (value, fallback, max) => {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return Math.min(parsed, max);
};

const buildDateRange = ({ startDate, endDate }) => {
  const range = {};

  if (startDate) {
    const start = new Date(startDate);
    if (!Number.isNaN(start.getTime())) {
      start.setHours(0, 0, 0, 0);
      range.$gte = start;
    }
  }

  if (endDate) {
    const end = new Date(endDate);
    if (!Number.isNaN(end.getTime())) {
      end.setHours(23, 59, 59, 999);
      range.$lte = end;
    }
  }

  return Object.keys(range).length ? range : null;
};

const getDefaultTrendStart = () => {
  const start = new Date();
  start.setMonth(start.getMonth() - 5);
  start.setDate(1);
  start.setHours(0, 0, 0, 0);
  return start;
};

const getRevenueStats = async (req, res) => {
  try {
    const dateRange = buildDateRange(req.query);
    const dateMatch = dateRange
      ? { paidAt: dateRange }
      : { paidAt: { $gte: getDefaultTrendStart() } };

    const [overview, revenueByPlan, monthlyRevenue, statusSummary] = await Promise.all([
      ProSubscription.aggregate([
        { $match: { status: "paid" } },
        { $addFields: { paidAt: { $ifNull: ["$startsAt", "$createdAt"] } } },
        ...(dateRange ? [{ $match: { paidAt: dateRange } }] : []),
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: "$amount" },
            totalTransactions: { $sum: 1 },
            averageOrderValue: { $avg: "$amount" },
          },
        },
      ]),
      ProSubscription.aggregate([
        { $match: { status: "paid" } },
        { $addFields: { paidAt: { $ifNull: ["$startsAt", "$createdAt"] } } },
        ...(dateRange ? [{ $match: { paidAt: dateRange } }] : []),
        {
          $group: {
            _id: "$plan",
            count: { $sum: 1 },
            revenue: { $sum: "$amount" },
          },
        },
        { $sort: { revenue: -1 } },
      ]),
      ProSubscription.aggregate([
        { $match: { status: "paid" } },
        { $addFields: { paidAt: { $ifNull: ["$startsAt", "$createdAt"] } } },
        { $match: dateMatch },
        {
          $group: {
            _id: { year: { $year: "$paidAt" }, month: { $month: "$paidAt" } },
            count: { $sum: 1 },
            revenue: { $sum: "$amount" },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
      ]),
      ProSubscription.aggregate([
        { $addFields: { paidAt: { $ifNull: ["$startsAt", "$createdAt"] } } },
        ...(dateRange ? [{ $match: { paidAt: dateRange } }] : []),
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
            revenue: { $sum: { $cond: [{ $eq: ["$status", "paid"] }, "$amount", 0] } },
          },
        },
      ]),
    ]);

    const summary = overview[0] || {
      totalRevenue: 0,
      totalTransactions: 0,
      averageOrderValue: 0,
    };
    const statusMap = statusSummary.reduce((result, item) => {
      result[item._id] = { count: item.count, revenue: item.revenue };
      return result;
    }, {});

    res.json({
      success: true,
      data: {
        totalRevenue: summary.totalRevenue || 0,
        totalTransactions: summary.totalTransactions || 0,
        averageOrderValue: Math.round(summary.averageOrderValue || 0),
        revenueByPlan,
        monthlyRevenue,
        statusSummary: VALID_STATUSES.map((status) => ({
          status,
          count: statusMap[status]?.count || 0,
          revenue: statusMap[status]?.revenue || 0,
        })),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getTransactions = async (req, res) => {
  try {
    const page = parsePositiveInt(req.query.page, 1, 100000);
    const limit = parsePositiveInt(req.query.limit, 20, 100);
    const { status, plan, startDate, endDate } = req.query;
    const filter = {};

    if (VALID_STATUSES.includes(status)) filter.status = status;
    if (VALID_PLANS.includes(plan)) filter.plan = plan;

    const dateRange = buildDateRange({ startDate, endDate });
    if (dateRange) filter.createdAt = dateRange;

    const [total, transactions] = await Promise.all([
      ProSubscription.countDocuments(filter),
      ProSubscription.find(filter)
        .populate("userId", "fullName email phone")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
    ]);

    res.json({
      success: true,
      data: {
        transactions,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit) || 1,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getRevenueStats, getTransactions };
