import { useState } from "react";
import toast from "react-hot-toast";
import reviewService from "../../services/review.service";

const ReviewModal = ({
  isOpen,
  onClose,
  orderId,
  rentalContractId,
  postId,
  reviewUserId,
  onSuccess
}) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      toast.error("Vui lòng chọn số sao đánh giá");
      return;
    }

    // Chỉ gửi reviewUserId nếu nó là ID (không phải object)
    const safeReviewUserId = (typeof reviewUserId === 'object' && reviewUserId?._id)
      ? reviewUserId._id
      : (typeof reviewUserId === 'string' ? reviewUserId : null);
    // Làm tương tự cho postId (nếu nó là object)
    const safePostId = (typeof postId === 'object' && postId?._id)
      ? postId._id
      : (typeof postId === 'string' ? postId : postId);

    console.log("Submitting review payload (sanitized):", {
      reviewUserId: safeReviewUserId,
      postId: safePostId,
      orderId,
      rentalContractId,
      reviewType: "product",
      rating,
      comment
    });

    setLoading(true);
    try {
      await reviewService.createReview({
        reviewUserId: safeReviewUserId, // chỉ gửi nếu là ID hợp lệ
        postId: safePostId,
        orderId,
        rentalContractId,
        reviewType: "product",
        rating,
        comment
      });
      toast.success("Cảm ơn bạn đã gửi đánh giá!");
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error("Review submission error:", err);
      toast.error(err.response?.data?.message || "Có lỗi xảy ra khi gửi đánh giá");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-md" style={{ animation: 'scaleUp 0.2s ease-out' }}>
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-xl font-bold text-gray-900">Đánh giá sản phẩm</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-red-500 transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col items-center justify-center py-4">
            <p className="text-sm font-medium text-gray-600 mb-2">Chất lượng sản phẩm thế nào?</p>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(star)}
                  className="transition-transform hover:scale-110"
                >
                  <span
                    className={`material-symbols-outlined text-4xl ${(hoverRating || rating) >= star
                      ? "text-yellow-400 [font-variation-settings:'FILL' 1]"
                      : "text-gray-300"
                      }`}
                  >
                    star
                  </span>
                </button>
              ))}
            </div>
            <p className="text-xs text-green-700 mt-2 font-medium h-4">
              {rating === 1 && "Rất tệ"}
              {rating === 2 && "Tệ"}
              {rating === 3 && "Bình thường"}
              {rating === 4 && "Tốt"}
              {rating === 5 && "Tuyệt vời"}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nhận xét chi tiết (Tuỳ chọn)</label>
            <textarea
              className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600 transition-all resize-none h-24 placeholder:text-gray-400"
              placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm này..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            ></textarea>
          </div>

          <div className="flex justify-end gap-3 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading || rating === 0}
              className="px-5 py-2.5 bg-green-700 text-white rounded-xl font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
            >
              {loading && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>}
              Gửi đánh giá
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReviewModal;
