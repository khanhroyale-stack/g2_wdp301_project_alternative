const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/auth.middleware");
const { getStats, getAllOrders, getAllRentals } = require("../controllers/stats.controller");

router.get("/stats", protect, authorize("admin"), getStats);
router.get("/orders", protect, authorize("admin"), getAllOrders);
router.get("/rentals", protect, authorize("admin"), getAllRentals);

module.exports = router;
