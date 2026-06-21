const express = require("express");
const { protect, activeOnly, shipperOnly, adminOnly } = require("../middleware/auth.middleware");
const {
  createShipperReport,
  getMyShipperReports,
  getAdminShipperReports,
  resolveShipperReport,
} = require("../controllers/shipper_report.controller");

const router = express.Router();
router.use(protect, activeOnly);
router.post("/", shipperOnly, createShipperReport);
router.get("/my", shipperOnly, getMyShipperReports);
router.get("/admin", adminOnly, getAdminShipperReports);
router.patch("/:id", adminOnly, resolveShipperReport);

module.exports = router;
