const express = require("express");
const {
  getAvailableDeliveries,
  acceptDelivery,
  getMyDeliveries,
  getDeliveryById,
  updateDeliveryStatus
} = require("../controllers/delivery.controller");
const { protect, shipperOnly, activeOnly } = require("../middleware/auth.middleware");

const router = express.Router();

// Protected routes
router.use(protect, activeOnly);

// Shipper-only routes
router.get("/available", shipperOnly, getAvailableDeliveries);
router.post("/:id/accept", shipperOnly, acceptDelivery);
router.get("/my-deliveries", shipperOnly, getMyDeliveries);
router.patch("/:id/status", shipperOnly, updateDeliveryStatus);

// Common routes
router.get("/:id", getDeliveryById);

module.exports = router;
