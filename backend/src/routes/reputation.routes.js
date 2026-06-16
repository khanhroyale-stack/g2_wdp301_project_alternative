const express = require("express");
const router = express.Router();
const {
  getMyReputation,
  getUserReputation,
  adminDeduct,
  adminGetHistory,
} = require("../controllers/reputation.controller");
const { protect, adminOnly } = require("../middleware/auth.middleware");

router.get("/me", protect, getMyReputation);
router.post("/admin/deduct", protect, adminOnly, adminDeduct);
router.get("/admin/:userId/history", protect, adminOnly, adminGetHistory);
router.get("/:userId", getUserReputation);

module.exports = router;
