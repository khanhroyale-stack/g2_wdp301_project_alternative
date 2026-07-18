const express = require("express");
const router = express.Router();
const { protect, adminOnly } = require("../middleware/auth.middleware");
const {
  createReview,
  getPostReviews,
  getUserReviews,
  getMyReviews,
  adminHideReview,
  adminGetAllReviews,
} = require("../controllers/review.controller");

router.post("/", protect, createReview);
router.get("/my", protect, getMyReviews);
router.get("/post/:postId", getPostReviews);        // public
router.get("/user/:userId", getUserReviews);        // public
router.get("/admin/all", protect, adminOnly, adminGetAllReviews);
router.patch("/:id/hide", protect, adminOnly, adminHideReview);

module.exports = router;
