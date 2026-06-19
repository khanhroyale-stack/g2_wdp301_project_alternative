const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth.middleware");
const {
  getCheckoutPreview, createOrder, getMyOrders, getMySales, getOrder, updateOrderStatus
} = require("../controllers/order.controller");

router.get("/checkout/:productId", protect, getCheckoutPreview);
router.post("/", protect, createOrder);
router.get("/my-orders", protect, getMyOrders);
router.get("/my-sales", protect, getMySales);
router.get("/:id", protect, getOrder);
router.patch("/:id/status", protect, updateOrderStatus);

module.exports = router;
