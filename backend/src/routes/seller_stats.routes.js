const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth.middleware");
const { getSellerStats } = require("../controllers/seller_stats.controller");

router.get("/stats", protect, getSellerStats);

module.exports = router;
