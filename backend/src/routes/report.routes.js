const express = require("express");
const router = express.Router();
const { protect, adminOnly } = require("../middleware/auth.middleware");
const {
  createReport,
  getAdminReports,
  getReportById,
  getMyReports,
  resolveReport,
  addReportEvidence,
} = require("../controllers/report.controller");

router.post("/", protect, createReport);
router.get("/my", protect, getMyReports);
router.get("/", protect, adminOnly, getAdminReports);
router.get("/:id", protect, adminOnly, getReportById);
router.patch("/:id/resolve", protect, adminOnly, resolveReport);
router.post("/:id/evidence", protect, addReportEvidence);

module.exports = router;
