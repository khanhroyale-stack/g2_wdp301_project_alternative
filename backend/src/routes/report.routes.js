const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/auth.middleware");
const { createReport, getAdminReports, resolveReport } = require("../controllers/report.controller");

router.post("/", protect, createReport);
router.get("/", protect, authorize("admin"), getAdminReports);
router.patch("/:id/resolve", protect, authorize("admin"), resolveReport);

module.exports = router;
