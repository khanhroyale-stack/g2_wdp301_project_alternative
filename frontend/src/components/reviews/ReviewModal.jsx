import React, { useState } from "react";
import toast from "react-hot-toast";
import reviewService from "../../services/review.service";

const ReviewModal = ({ 
  isOpen, 
  onClose, 
  orderId, 
  rentalContractId, 
  reviewUserId, 
  postId, 
  reviewType, 
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

    setLoading(true);
    try {
      await reviewService.createReview({
        reviewUserId,
        postId,
        orderId,
        rentalContractId,
        reviewType,
        rating,
        comment
      });
      toast.success("Cảm ơn bạn đã gửi đánh giá!");
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Có lỗi xảy ra khi gửi đánh giá");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-apple-md w-full max-w-md animate-scale-up">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-xl font-bold text-on-surface">Đánh giá {reviewType === 'seller' ? 'Người bán' : 'Giao dịch'}</h2>
          <button onClick={onClose} className="text-on-surface-variant hover:text-error transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col items-center justify-center py-4">
            <p className="text-sm font-medium text-on-surface-variant mb-2">Chất lượng giao dịch thế nào?</p>
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
                    className={`material-symbols-outlined text-4xl ${
                      (hoverRating || rating) >= star 
                        ? "text-yellow-400 [font-variation-settings:'FILL'1]" 
                        : "text-surface-dim"
                    }`}
                  >
                    star
                  </span>
                </button>
              ))}
            </div>
            <p className="text-xs text-primary mt-2 font-medium h-4">
              {rating === 1 && "Rất tệ"}
              {rating === 2 && "Tệ"}
              {rating === 3 && "Bình thường"}
              {rating === 4 && "Tốt"}
              {rating === 5 && "Tuyệt vời"}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-on-surface mb-2">Nhận xét chi tiết (Tuỳ chọn)</label>
            <textarea
              className="w-full bg-surface-container-low border border-surface-variant/50 rounded-xl p-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-none h-24 placeholder:text-on-surface-variant/50"
              placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm và người dùng này..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            ></textarea>
          </div>

          <div className="flex justify-end gap-3 mt-2">
            <button 
              type="button" 
              onClick={onClose} 
              className="px-5 py-2.5 bg-surface-container text-on-surface rounded-xl font-medium hover:bg-surface-variant transition-colors"
            >
              Hủy
            </button>
            <button 
              type="submit" 
              disabled={loading || rating === 0}
              className="px-5 py-2.5 bg-primary text-on-primary rounded-xl font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
            >
              {loading && <span className="w-4 h-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin"></span>}
              Gửi đánh giá
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReviewModal;
