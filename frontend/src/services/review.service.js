import api from "./api";

const reviewService = {
  // Tạo đánh giá
  createReview: (data) =>
    api.post("/reviews", data).then((r) => r.data),

  // Đánh giá của 1 bài đăng (public)
  getPostReviews: (postId) =>
    api.get(`/reviews/post/${postId}`).then((r) => r.data),

  // Đánh giá của 1 user (public)
  getUserReviews: (userId) =>
    api.get(`/reviews/user/${userId}`).then((r) => r.data),

  // Đánh giá tôi đã viết
  getMyReviews: () =>
    api.get("/reviews/my").then((r) => r.data),

  // Admin ẩn review
  adminHideReview: (id) =>
    api.patch(`/reviews/${id}/hide`).then((r) => r.data),

  // Admin xem tất cả
  adminGetAllReviews: (page = 1, limit = 20) =>
    api.get("/reviews/admin/all", { params: { page, limit } }).then((r) => r.data),
};

export default reviewService;
