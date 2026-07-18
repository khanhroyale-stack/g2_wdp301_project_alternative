const Review = require("../models/review.model");
const User = require("../models/user.model");
const Order = require("../models/order.model");
const RentalContract = require("../models/rental_contract.model");
const ProductPost = require("../models/product_post.model");
const { createNotification } = require("./notification.controller");

// POST /api/reviews
const createReview = async (req, res) => {
  try {
    const {
      reviewUserId,   // người được đánh giá
      postId,
      orderId,
      rentalContractId,
      reviewType,     // "seller" | "buyer" | "renter" | "owner"
      rating,
      comment,
    } = req.body;

    if (!reviewUserId || !postId || !reviewType || !rating) {
      return res.status(400).json({ success: false, message: "Thiếu thông tin bắt buộc" });
    }

    // ── Logic 1: Kiểm tra giao dịch phải COMPLETED trước khi review ──
    if (orderId) {
      const order = await Order.findById(orderId);
      if (!order) {
        return res.status(404).json({ success: false, message: "Không tìm thấy đơn hàng" });
      }
      // Chỉ buyer hoặc seller của đơn này mới được review
      const isParticipant =
        String(order.buyerId) === String(req.user._id) ||
        String(order.sellerId) === String(req.user._id);
      if (!isParticipant) {
        return res.status(403).json({ success: false, message: "Bạn không tham gia đơn hàng này" });
      }
      if (order.orderStatus !== "delivered") {
        return res.status(400).json({
          success: false,
          message: "Chỉ được đánh giá sau khi đơn hàng đã giao thành công",
        });
      }
    }

    if (rentalContractId) {
      const contract = await RentalContract.findById(rentalContractId);
      if (!contract) {
        return res.status(404).json({ success: false, message: "Không tìm thấy hợp đồng thuê" });
      }
      // Chỉ renter hoặc owner mới được review
      const isParticipant =
        String(contract.renterId) === String(req.user._id) ||
        String(contract.ownerId) === String(req.user._id);
      if (!isParticipant) {
        return res.status(403).json({ success: false, message: "Bạn không tham gia hợp đồng này" });
      }
      if (contract.contractStatus !== "completed") {
        return res.status(400).json({
          success: false,
          message: "Chỉ được đánh giá sau khi hợp đồng thuê đã hoàn tất",
        });
      }
    }

    // ── Chặn review trùng: 1 orderId/rentalContractId chỉ được review 1 lần bởi 1 người ──
    const existFilter = { reviewerId: req.user._id };
    if (orderId) existFilter.orderId = orderId;
    else if (rentalContractId) existFilter.rentalContractId = rentalContractId;

    if (orderId || rentalContractId) {
      const existing = await Review.findOne(existFilter);
      if (existing) {
        return res.status(400).json({ success: false, message: "Bạn đã đánh giá giao dịch này rồi" });
      }
    }

    const review = await Review.create({
      reviewerId: req.user._id,
      reviewUserId,
      postId,
      orderId: orderId || null,
      rentalContractId: rentalContractId || null,
      reviewType,
      rating,
      comment: comment || null,
    });

    // ── Tính và lưu averageRating vào User ──
    const allReviews = await Review.find({ reviewUserId, isHidden: { $ne: true } });
    const avg = allReviews.length
      ? Math.round((allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length) * 10) / 10
      : 0;
    await User.findByIdAndUpdate(reviewUserId, { averageRating: avg });

    // Notify người được đánh giá
    await createNotification({
      recipientId: reviewUserId,
      type: "review",
      title: "Bạn nhận được đánh giá mới",
      content: `${req.user.fullName} đã đánh giá ${rating}⭐ cho bạn.`,
      relatedType: "review",
      relatedId: review._id,
    });

    res.status(201).json({ success: true, data: review, averageRating: avg });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/reviews/post/:postId — đánh giá của 1 bài đăng (lọc bỏ review đã ẩn)
const getPostReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ postId: req.params.postId, isHidden: { $ne: true } })
      .populate("reviewerId", "fullName avatarUrl")
      .sort({ createdAt: -1 });

    const avg = reviews.length
      ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10
      : 0;

    res.json({ success: true, data: reviews, averageRating: avg, count: reviews.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/reviews/user/:userId — đánh giá của 1 user (lọc bỏ review đã ẩn)
const getUserReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ reviewUserId: req.params.userId, isHidden: { $ne: true } })
      .populate("reviewerId", "fullName avatarUrl")
      .populate("postId", "title")
      .sort({ createdAt: -1 });

    const avg = reviews.length
      ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10
      : 0;

    res.json({ success: true, data: reviews, averageRating: avg, count: reviews.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/reviews/my — đánh giá tôi đã viết
const getMyReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ reviewerId: req.user._id })
      .populate("reviewUserId", "fullName avatarUrl")
      .populate("postId", "title")
      .sort({ createdAt: -1 });
    res.json({ success: true, data: reviews });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /api/reviews/:id/hide — admin ẩn review vi phạm
const adminHideReview = async (req, res) => {
  try {
    const review = await Review.findByIdAndUpdate(
      req.params.id,
      { isHidden: true },
      { new: true }
    );
    if (!review) return res.status(404).json({ success: false, message: "Không tìm thấy đánh giá" });

    // Cập nhật lại averageRating của user bị ẩn review
    const remaining = await Review.find({ reviewUserId: review.reviewUserId, isHidden: { $ne: true } });
    const avg = remaining.length
      ? Math.round((remaining.reduce((s, r) => s + r.rating, 0) / remaining.length) * 10) / 10
      : 0;
    await User.findByIdAndUpdate(review.reviewUserId, { averageRating: avg });

    res.json({ success: true, message: "Đã ẩn đánh giá" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/reviews/admin/all — admin xem tất cả reviews
const adminGetAllReviews = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const total = await Review.countDocuments({});
    const reviews = await Review.find({})
      .populate("reviewerId", "fullName email")
      .populate("reviewUserId", "fullName email")
      .populate("postId", "title")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    res.json({ success: true, data: reviews, total, page: Number(page), totalPages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { createReview, getPostReviews, getUserReviews, getMyReviews, adminHideReview, adminGetAllReviews };
