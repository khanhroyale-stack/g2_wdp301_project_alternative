const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/auth.middleware");
const { createInspection, getInspection, getInspectionsByOrder, getInspectionsByRental, updateInspection, adminGetAllInspections } = require("../controllers/inspection.controller");

router.post("/", protect, authorize("shipper"), createInspection);
router.get("/order/:orderId", protect, getInspectionsByOrder);
router.get("/rental/:rentalId", protect, getInspectionsByRental);
router.get("/admin", protect, authorize("admin"), adminGetAllInspections);
router.get("/:id", protect, getInspection);
router.put("/:id", protect, authorize("shipper"), updateInspection);

module.exports = router;
