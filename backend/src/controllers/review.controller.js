const Review = require("../models/review.model");
const Product = require("../models/product.model");
const User = require("../models/user.model");

const createReview = async (req, res) => {
  try {
    const { productId, revieweeId, rating, comment, orderId, rentalId, reviewType } = req.body;
    const review = await Review.create({
      reviewer: req.user._id,
      reviewee: revieweeId,
      product: productId,
      order: orderId,
      rental: rentalId,
      rating, comment, reviewType,
    });

    // Cập nhật trung bình sản phẩm
    const reviews = await Review.find({ product: productId, isHidden: false });
    const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
    await Product.findByIdAndUpdate(productId, { averageRating: avg, reviewCount: reviews.length });

    // Cập nhật trung bình người bán
    const sellerReviews = await Review.find({ reviewee: revieweeId, isHidden: false });
    const sellerAvg = sellerReviews.reduce((s, r) => s + r.rating, 0) / sellerReviews.length;
    await User.findByIdAndUpdate(revieweeId, { averageRating: sellerAvg });

    res.status(201).json({ success: true, data: review });
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ success: false, message: "Bạn đã đánh giá giao dịch này rồi" });
    res.status(500).json({ success: false, message: err.message });
  }
};

const getProductReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ product: req.params.productId, isHidden: false })
      .populate("reviewer", "name avatar")
      .sort({ createdAt: -1 });
    res.json({ success: true, data: reviews });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const adminHideReview = async (req, res) => {
  try {
    await Review.findByIdAndUpdate(req.params.id, { isHidden: true });
    res.json({ success: true, message: "Đã ẩn đánh giá" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { createReview, getProductReviews, adminHideReview };
