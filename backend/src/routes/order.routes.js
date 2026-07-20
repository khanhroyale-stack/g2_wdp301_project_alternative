const express = require("express");
const {
  getCheckoutPreview,
  createOrder,
  getMyOrders,
  getMySales,
  getOrderById,
  updateOrderStatus,
  getAvailableOrdersForShipper,
  acceptOrderForShipper,
  getMyDeliveries,
  createInspection,
} = require("../controllers/order.controller");
const { protect, activeOnly, shipperOnly } = require("../middleware/auth.middleware");

const router = express.Router();

router.use(protect, activeOnly);

router.get("/checkout/:productId", getCheckoutPreview);
router.post("/", createOrder);
router.get("/my-orders", getMyOrders);
router.get("/my-sales", getMySales);
router.get("/shipper/available", shipperOnly, getAvailableOrdersForShipper);
router.patch("/shipper/:id/accept", shipperOnly, acceptOrderForShipper);
router.get("/shipper/my-deliveries", shipperOnly, getMyDeliveries);
router.post("/shipper/inspections", shipperOnly, createInspection);
router.get("/:id", getOrderById);
router.patch("/:id/status", updateOrderStatus);

module.exports = router;
