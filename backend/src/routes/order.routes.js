const express = require("express");
const {
  createOrder,
  getMyOrders,
  getMySales,
  getOrderById,
  updateOrderStatus,
  getCheckoutPreview
} = require("../controllers/order.controller");
const { protect, activeOnly } = require("../middleware/auth.middleware");

const router = express.Router();

// Protected routes - require authentication
router.use(protect, activeOnly);

router.get("/checkout/:productId", getCheckoutPreview);
router.post("/", createOrder);
router.get("/my-orders", getMyOrders);
router.get("/my-sales", getMySales);
router.get("/:id", getOrderById);
router.patch("/:id/status", updateOrderStatus);

module.exports = router;
