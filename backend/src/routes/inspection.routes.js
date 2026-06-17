const express = require("express");
const {
  createInspection,
  getInspectionsByDelivery,
  getInspectionById,
  getMyInspections
} = require("../controllers/inspection.controller");
const { protect, shipperOnly, activeOnly } = require("../middleware/auth.middleware");

const router = express.Router();

// Protected routes
router.use(protect, activeOnly);

// Shipper-only routes
router.post("/", shipperOnly, createInspection);
router.get("/my-inspections", shipperOnly, getMyInspections);

// Common routes
router.get("/delivery/:deliveryId", getInspectionsByDelivery);
router.get("/:id", getInspectionById);

module.exports = router;
