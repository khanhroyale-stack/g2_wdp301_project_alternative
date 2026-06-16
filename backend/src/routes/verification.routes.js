const express = require("express");
const router = express.Router();
const {
  uploadDocs,
  getMyStatus,
  adminListPending,
  adminGetDetail,
  adminApprove,
  adminReject,
} = require("../controllers/verification.controller");
const { protect, adminOnly } = require("../middleware/auth.middleware");
const { uploadVerification } = require("../middleware/upload.middleware");

router.get("/status", protect, getMyStatus);
router.post("/upload", protect, uploadVerification, uploadDocs);

router.get("/admin/list", protect, adminOnly, adminListPending);
router.get("/admin/:id", protect, adminOnly, adminGetDetail);
router.put("/admin/:id/approve", protect, adminOnly, adminApprove);
router.put("/admin/:id/reject", protect, adminOnly, adminReject);

module.exports = router;
