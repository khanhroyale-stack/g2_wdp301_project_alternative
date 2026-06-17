const express = require("express");
const router = express.Router();
const { protect, adminOnly, shipperOnly } = require("../middleware/auth.middleware");
const authorize = (role) => role === "admin" ? adminOnly : role === "shipper" ? shipperOnly : (req, res, next) => next();
const {
  createOrder, getMyOrders, getMySales, getOrder, updateOrderStatus,
  shipperGetAvailableOrders, shipperAcceptOrder, shipperGetMyDeliveries
} = require("../controllers/order.controller");

router.post("/", protect, createOrder);
router.get("/my-orders", protect, getMyOrders);
router.get("/my-sales", protect, getMySales);

// Shipper routes
router.get("/shipper/available", protect, authorize("shipper"), shipperGetAvailableOrders);
router.get("/shipper/my-deliveries", protect, authorize("shipper"), shipperGetMyDeliveries);
router.patch("/shipper/:id/accept", protect, authorize("shipper"), shipperAcceptOrder);

router.get("/:id", protect, getOrder);
router.patch("/:id/status", protect, updateOrderStatus);

module.exports = router;
