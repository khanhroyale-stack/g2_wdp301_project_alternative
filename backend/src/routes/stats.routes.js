const express = require("express");
const router = express.Router();
const { protect, adminOnly } = require("../middleware/auth.middleware");
const { getStats, getAllOrders, getAllRentals, getAllReputationLogs, getShippers, getAllDeliveries, getAllInspections } = require("../controllers/stats.controller");
const { getRevenueStats, getTransactions } = require("../controllers/admin_subscription.controller");

router.get("/stats", protect, adminOnly, getStats);
router.get("/revenue/stats", protect, adminOnly, getRevenueStats);
router.get("/revenue/transactions", protect, adminOnly, getTransactions);
router.get("/orders", protect, adminOnly, getAllOrders);
router.get("/rentals", protect, adminOnly, getAllRentals);
router.get("/reputation-logs", protect, adminOnly, getAllReputationLogs);
router.get("/shippers", protect, adminOnly, getShippers);
router.get("/deliveries", protect, adminOnly, getAllDeliveries);
router.get("/inspections", protect, adminOnly, getAllInspections);

module.exports = router;
