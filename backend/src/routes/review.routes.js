const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/auth.middleware");
const { createReview, getProductReviews, adminHideReview } = require("../controllers/review.controller");

router.post("/", protect, createReview);
router.get("/product/:productId", getProductReviews);
router.patch("/:id/hide", protect, authorize("admin"), adminHideReview);

module.exports = router;
