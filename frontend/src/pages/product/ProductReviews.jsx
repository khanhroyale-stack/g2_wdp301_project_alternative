import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import reviewService from "../../services/review.service";
import productService from "../../services/product.service";

const ProductReviews = () => {
  const { postId } = useParams();
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [averageRating, setAverageRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch product details
        const productRes = await productService.getProduct(postId);
        if (productRes.success) {
          setProduct(productRes.data);
        }

        // Fetch reviews
        const reviewsRes = await reviewService.getPostReviews(postId);
        if (reviewsRes.success) {
          setReviews(reviewsRes.data);
          setAverageRating(reviewsRes.averageRating);
          setReviewCount(reviewsRes.count);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };

    if (postId) {
      fetchData();
    }
  }, [postId]);

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span
        key={i}
        className={`material-symbols-outlined ${
          i < rating ? "text-yellow-400 [font-variation-settings:'FILL' 1]" : "text-gray-300"
        }`}
      >
        star
      </span>
    ));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <span className="material-symbols-outlined text-4xl text-primary animate-spin">refresh</span>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center pt-20">
          <span className="material-symbols-outlined text-6xl text-error mb-4">error</span>
          <h2 className="text-xl font-bold">Không tìm thấy sản phẩm</h2>
          <Link to="/" className="mt-4 px-6 py-2 bg-primary text-white rounded-full hover:opacity-90 transition-all">
            Quay lại trang chủ
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F7] flex flex-col">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 md:px-10 pt-24 pb-24 w-full flex-grow">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant/40 mb-8 bg-white/40 backdrop-blur-md px-6 py-3 rounded-full w-fit border border-primary/5 shadow-sm">
          <Link to="/" className="hover:text-primary transition-colors flex items-center">
            <span className="material-symbols-outlined text-[14px] mr-1.5">home</span>
            Trang chủ
          </Link>
          <span className="material-symbols-outlined text-[12px] opacity-30">chevron_right</span>
          <Link to={`/marketplaces/${postId}`} className="hover:text-primary transition-colors">
            {product.title?.substring(0, 30)}...
          </Link>
          <span className="material-symbols-outlined text-[12px] opacity-30">chevron_right</span>
          <span className="text-primary">Đánh giá</span>
        </div>

        {/* Header */}
        <div className="bg-white rounded-[28px] p-6 md:p-8 shadow-sm mb-8 border border-primary/5">
          <div className="flex items-center gap-4 mb-6">
            {product.images?.[0] ? (
              <img
                src={product.images[0]}
                alt={product.title}
                className="w-20 h-20 rounded-xl object-cover"
              />
            ) : (
              <div className="w-20 h-20 rounded-xl bg-gray-100 flex items-center justify-center">
                <span className="material-symbols-outlined text-gray-400 text-3xl">image</span>
              </div>
            )}
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{product.title}</h1>
              <Link
                to={`/marketplaces/${postId}`}
                className="text-sm text-primary font-medium hover:underline"
              >
                Xem chi tiết sản phẩm
              </Link>
            </div>
          </div>

          {/* Rating summary */}
          <div className="flex items-center gap-8 p-6 bg-gray-50 rounded-2xl">
            <div className="text-center">
              <p className="text-5xl font-bold text-primary">{averageRating.toFixed(1)}</p>
              <div className="flex justify-center mt-2">{renderStars(Math.round(averageRating))}</div>
              <p className="text-sm text-gray-500 mt-2">{reviewCount} đánh giá</p>
            </div>
            <div className="flex-1 space-y-2">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = reviews.filter((r) => r.rating === star).length;
                const percentage = reviewCount > 0 ? (count / reviewCount) * 100 : 0;
                return (
                  <div key={star} className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-600 w-6">{star}</span>
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-yellow-400 rounded-full"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-500 w-8">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Reviews list */}
        <div className="space-y-6">
          {reviews.length === 0 ? (
            <div className="bg-white rounded-[28px] p-12 text-center shadow-sm border border-primary/5">
              <span className="material-symbols-outlined text-5xl text-primary/20 mb-4">rate_review</span>
              <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">
                Chưa có đánh giá
              </p>
            </div>
          ) : (
            reviews.map((review) => (
              <div
                key={review._id}
                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
              >
                <div className="flex items-center gap-4 mb-4">
                  {review.reviewerId?.avatarUrl ? (
                    <img
                      src={review.reviewerId.avatarUrl}
                      alt={review.reviewerId.fullName}
                      className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-md"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center font-bold text-lg shadow-md border-2 border-white">
                      {review.reviewerId?.fullName?.charAt(0)?.toUpperCase() || "U"}
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="font-bold text-gray-900">{review.reviewerId?.fullName || "Người dùng"}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {renderStars(review.rating)}
                      <span className="text-xs text-gray-400">
                        {new Date(review.createdAt).toLocaleDateString("vi-VN")}
                      </span>
                    </div>
                  </div>
                </div>
                {review.comment && (
                  <p className="text-gray-700 leading-relaxed">{review.comment}</p>
                )}
              </div>
            ))
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ProductReviews;
