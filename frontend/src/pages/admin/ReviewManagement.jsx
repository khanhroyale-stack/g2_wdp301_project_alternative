import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import { useAuth } from "../../context/AuthContext";
import reviewService from "../../services/review.service";
import toast from "react-hot-toast";

const ReviewManagement = () => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hidingId, setHidingId] = useState(null);

  const fetchReviews = async (currentPage = 1) => {
    try {
      setLoading(true);
      const res = await reviewService.adminGetAllReviews(currentPage, 20);
      if (res.success) {
        setReviews(res.data);
        setTotalPages(res.totalPages || 1);
        setPage(res.page || 1);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể tải danh sách đánh giá');
    } finally {
      setLoading(false);
    }
  };

  const handleHideReview = async (reviewId) => {
    try {
      setHidingId(reviewId);
      const res = await reviewService.adminHideReview(reviewId);
      if (res.success) {
        toast.success(res.message || 'Đã ẩn đánh giá');
        await fetchReviews(page);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể ẩn đánh giá');
    } finally {
      setHidingId(null);
    }
  };

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchReviews(1);
    }
  }, [user]);

  const getRatingStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span
        key={i}
        className={`material-symbols-outlined text-lg ${i < rating
            ? 'text-yellow-400 [font-variation-settings:"FILL" 1]'
            : 'text-gray-300'
          }`}
      >
        star
      </span>
    ));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex">
        <Sidebar variant="admin" />
        <main className="flex flex-1 items-center justify-center md:ml-72">
          <div className="flex flex-col items-center gap-4 text-primary/40">
            <div className="h-12 w-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
            <p className="text-xs font-black uppercase tracking-widest">Đang tải danh sách đánh giá...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex selection:bg-primary/20">
      <Sidebar variant="admin" />
      <main className="flex-1 px-4 py-12 md:ml-72 md:px-12">
        <h1 className="text-3xl font-display font-black text-foreground mb-8 flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/5 text-primary">
            <span className="material-symbols-outlined text-[20px]">reviews</span>
          </div>
          Quản lý Đánh giá
        </h1>

        <div className="bg-white rounded-organic p-0 shadow-sm border border-primary/5 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50/50 border-b border-primary/10">
                <tr>
                  <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60">
                    Người đánh giá
                  </th>
                  <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60">
                    Người được đánh giá
                  </th>
                  <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60">
                    Sản phẩm
                  </th>
                  <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60">
                    Đánh giá
                  </th>
                  <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60">
                    Bình luận
                  </th>
                  <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60">
                    Ngày tạo
                  </th>
                  <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60">
                    Hành động
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary/5">
                {reviews.map((review) => (
                  <tr
                    key={review._id}
                    className={`hover:bg-background/50 transition-colors ${review.isHidden ? 'bg-red-50/50' : ''
                      }`}
                  >
                    <td className="px-8 py-5 whitespace-nowrap">
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-xs font-black text-primary overflow-hidden">
                          {review.reviewerId?.avatarUrl ? (
                            <img src={review.reviewerId.avatarUrl} alt="" className="h-full w-full object-cover" />
                          ) : (
                            review.reviewerId?.fullName?.charAt(0)?.toUpperCase() || "U"
                          )}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-foreground">
                            {review.reviewerId?.fullName || 'N/A'}
                          </div>
                          <div className="text-xs text-on-surface-variant/60">
                            {review.reviewerId?.email || ''}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5 whitespace-nowrap">
                      {review.reviewUserId ? (
                        <div className="flex items-center gap-4">
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary/10 text-xs font-black text-secondary overflow-hidden">
                            {review.reviewUserId?.avatarUrl ? (
                              <img src={review.reviewUserId.avatarUrl} alt="" className="h-full w-full object-cover" />
                            ) : (
                              review.reviewUserId?.fullName?.charAt(0)?.toUpperCase() || "U"
                            )}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-foreground">
                              {review.reviewUserId?.fullName || 'N/A'}
                            </div>
                            <div className="text-xs text-on-surface-variant/60">
                              {review.reviewUserId?.email || ''}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-on-surface-variant/40">—</span>
                      )}
                    </td>
                    <td className="px-8 py-5 whitespace-nowrap">
                      {review.postId ? (
                        <Link
                          to={`/marketplaces/${review.postId?._id || review.postId}`}
                          className="text-sm font-bold text-primary hover:underline"
                        >
                          {review.postId?.title || 'Xem sản phẩm'}
                        </Link>
                      ) : (
                        <span className="text-xs text-on-surface-variant/40">—</span>
                      )}
                    </td>
                    <td className="px-8 py-5 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        {getRatingStars(review.rating)}
                        <span className="text-sm font-bold text-foreground ml-1">
                          {review.rating}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="text-sm text-on-surface-variant/80 max-w-xs truncate">
                        {review.comment || 'Không có bình luận'}
                      </div>
                    </td>
                    <td className="px-8 py-5 whitespace-nowrap text-sm text-on-surface-variant/60">
                      {new Date(review.createdAt).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-8 py-5 whitespace-nowrap text-sm">
                      {review.isHidden ? (
                        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-pill text-[10px] font-black uppercase tracking-widest bg-red-50 text-red-600 border border-red-100">
                          <span className="material-symbols-outlined text-sm">
                            visibility_off
                          </span>
                          Đã ẩn
                        </span>
                      ) : (
                        <button
                          onClick={() => handleHideReview(review._id)}
                          disabled={hidingId === review._id}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-pill text-xs font-black uppercase tracking-widest text-red-600 bg-red-50 hover:bg-red-100 transition-all disabled:opacity-50 border border-red-100"
                        >
                          {hidingId === review._id ? (
                            <span className="material-symbols-outlined animate-spin text-sm">
                              refresh
                            </span>
                          ) : (
                            <span className="material-symbols-outlined text-sm">
                              visibility_off
                            </span>
                          )}
                          Ẩn đánh giá
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex justify-between items-center px-8 py-6 border-t border-primary/5 bg-gray-50/30">
              <button
                onClick={() => fetchReviews(page - 1)}
                disabled={page <= 1}
                className="inline-flex items-center gap-2 px-5 py-2.5 border border-primary/10 rounded-pill text-xs font-black uppercase tracking-widest text-on-surface-variant/80 bg-white hover:bg-primary/5 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <span className="material-symbols-outlined text-sm">
                  arrow_back
                </span>
                Trước
              </button>
              <span className="text-xs font-black uppercase tracking-widest text-on-surface-variant/60">
                Trang {page} / {totalPages}
              </span>
              <button
                onClick={() => fetchReviews(page + 1)}
                disabled={page >= totalPages}
                className="inline-flex items-center gap-2 px-5 py-2.5 border border-primary/10 rounded-pill text-xs font-black uppercase tracking-widest text-on-surface-variant/80 bg-white hover:bg-primary/5 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Sau
                <span className="material-symbols-outlined text-sm">
                  arrow_forward
                </span>
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ReviewManagement;
