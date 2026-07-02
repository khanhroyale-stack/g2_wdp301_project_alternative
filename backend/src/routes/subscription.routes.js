const express = require("express");
const {
  getPlans,
  createPayment,
  vnpayReturn,
  getMySubscriptions,
  getStatus,
} = require("../controllers/subscription.controller");
const { protect } = require("../middleware/auth.middleware");

const router = express.Router();

router.get("/plans", getPlans);
router.post("/create", protect, createPayment);
router.get("/vnpay-return", vnpayReturn);
router.get("/me", protect, getMySubscriptions);
router.get("/status", protect, getStatus);

module.exports = router;
