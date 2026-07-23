const Review = require("../models/review.model");
const User = require("../models/user.model");
const Order = require("../models/order.model");
const RentalContract = require("../models/rental_contract.model");
const Delivery = require("../models/delivery.model");
const ProductPost = require("../models/product_post.model");
const { createNotification } = require("./notification.controller");

const completedOrderStatuses = new Set(["completed", "COMPLETED"]);
const completedDeliveryStatuses = new Set(["completed", "COMPLETED"]);

const getOrderStatus = (order) => order?.orderStatus || order?.status || "";
const getDeliveryStatus = (delivery) => delivery?.deliveryStatus || delivery?.status || "";

// POST /api/reviews
const createReview = async (req, res) => {
  try {
    const {
      reviewUserId,
      postId,
      orderId,
      rentalContractId,
      reviewType,
      rating,
      comment,
    } = req.body;

    if (!postId || !rating) {
      return res.status(400).json({ success: false, message: "Thiếu thông tin bắt buộc" });
    }

    // ── Logic 1: Kiểm tra giao dịch phải COMPLETED trước khi review ──
    if (orderId) {
      const order = await Order.findById(orderId);
      if (!order) {
        return res.status(404).json({ success: false, message: "Không tìm thấy đơn hàng" });
      }
      const delivery = await Delivery.findOne({ orderId: order._id }).select("deliveryStatus status");
      // Chỉ buyer của đơn này mới được review sản phẩm
      const isBuyer = String(order.buyerId) === String(req.user._id);
      if (!isBuyer) {
        return res.status(403).json({ success: false, message: "Bạn không phải người mua của đơn hàng này" });
      }
      const orderStatus = getOrderStatus(order);
      const deliveryStatus = getDeliveryStatus(delivery);
      const canReviewCompletedOrder =
        completedOrderStatuses.has(orderStatus) || completedDeliveryStatuses.has(deliveryStatus);
      if (!canReviewCompletedOrder) {
        return res.status(400).json({
          success: false,
          message: `Chỉ được đánh giá sau khi bạn xác nhận đã nhận hàng (order: ${orderStatus || "none"}, delivery: ${deliveryStatus || "none"})`,
        });
      }
    }

    if (rentalContractId) {
      const contract = await RentalContract.findById(rentalContractId);
      if (!contract) {
        return res.status(404).json({ success: false, message: "Không tìm thấy hợp đồng thuê" });
      }
      // Chỉ renter của hợp đồng này mới được review sản phẩm
      const isRenter = String(contract.renterId) === String(req.user._id);
      if (!isRenter) {
        return res.status(403).json({ success: false, message: "Bạn không phải người thuê của hợp đồng này" });
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
        return res.status(400).json({ success: false, message: "Bạn đã đánh giá sản phẩm này rồi" });
      }
    }

    // Prepare review data
    const reviewData = {
      reviewerId: req.user._id,
      postId,
      reviewType: reviewType || "product",
      rating
    };
    if (reviewUserId) reviewData.reviewUserId = reviewUserId;
    if (orderId) reviewData.orderId = orderId;
    if (rentalContractId) reviewData.rentalContractId = rentalContractId;
    if (comment) reviewData.comment = comment;

    let review;
    try {
      review = await Review.create(reviewData);
    } catch (schemaError) {
      console.error("[review.createReview] Validation failed:", schemaError);
      if (schemaError.errInfo?.details?.schemaRulesNotSatisfied) {
        console.error("[review.createReview] JSON schema rules not satisfied:", JSON.stringify(schemaError.errInfo.details.schemaRulesNotSatisfied, null, 2));
      }
      if (schemaError.name === "ValidationError") {
        return res.status(400).json({
          success: false,
          message: schemaError.message,
          errors: schemaError.errors
        });
      }
      throw schemaError;
    }

    // ── Tính và lưu averageRating vào User (nếu có reviewUserId) ──
    if (reviewUserId) {
      const allUserReviews = await Review.find({ reviewUserId, isHidden: { $ne: true } });
      const userAvg = allUserReviews.length
        ? Math.round((allUserReviews.reduce((s, r) => s + r.rating, 0) / allUserReviews.length) * 10) / 10
        : 0;
      await User.findByIdAndUpdate(reviewUserId, { averageRating: userAvg });

      // Notify người được đánh giá
      await createNotification({
        recipientId: reviewUserId,
        type: "review",
        title: "Bạn nhận được đánh giá mới",
        content: `${req.user.fullName} đã đánh giá ${rating}⭐ cho bạn.`,
        relatedType: "review",
        relatedId: review._id,
      });
    }

    // ── Tính và lưu averageRating và reviewCount vào ProductPost ──
    const allProductReviews = await Review.find({ postId, isHidden: { $ne: true } });
    const productAvg = allProductReviews.length
      ? Math.round((allProductReviews.reduce((s, r) => s + r.rating, 0) / allProductReviews.length) * 10) / 10
      : 0;
    await ProductPost.findByIdAndUpdate(postId, {
      averageRating: productAvg,
      reviewCount: allProductReviews.length
    });

    res.status(201).json({ success: true, data: review, productAverageRating: productAvg, productReviewCount: allProductReviews.length });
  } catch (err) {
    console.error("Error creating review:", err);
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

    // Cập nhật lại averageRating của user bị ẩn review (nếu có)
    if (review.reviewUserId) {
      const remaining = await Review.find({ reviewUserId: review.reviewUserId, isHidden: { $ne: true } });
      const avg = remaining.length
        ? Math.round((remaining.reduce((s, r) => s + r.rating, 0) / remaining.length) * 10) / 10
        : 0;
      await User.findByIdAndUpdate(review.reviewUserId, { averageRating: avg });
    }

    // Cập nhật lại averageRating và reviewCount của ProductPost (nếu có)
    if (review.postId) {
      const remainingProductReviews = await Review.find({ postId: review.postId, isHidden: { $ne: true } });
      const productAvg = remainingProductReviews.length
        ? Math.round((remainingProductReviews.reduce((s, r) => s + r.rating, 0) / remainingProductReviews.length) * 10) / 10
        : 0;
      await ProductPost.findByIdAndUpdate(review.postId, {
        averageRating: productAvg,
        reviewCount: remainingProductReviews.length
      });
    }

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
