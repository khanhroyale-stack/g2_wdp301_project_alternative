import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import userService from "../../services/user.service";
import productService from "../../services/product.service";
import reviewService from "../../services/review.service";

const VER_BADGE = {
  unverified: { label: "Chưa xác minh", cls: "bg-surface-container text-on-surface-variant" },
  verified: { label: "Đã xác minh ✓", cls: "bg-secondary-container text-on-secondary-container" },
};

const ACC_BADGE = {
  active: { label: "Đang hoạt động", cls: "text-secondary" },
  inactive: { label: "Chưa kích hoạt", cls: "text-on-surface-variant" },
  banned: { label: "Tài khoản bị khóa", cls: "text-error" },
};

const formatPrice = (num) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(num || 0);

const PublicProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [products, setProducts] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [reviewMeta, setReviewMeta] = useState({ averageRating: 0, count: 0 });

  useEffect(() => {
    setLoading(true);
    setNotFound(false);
    userService.getPublicProfile(id)
      .then((res) => {
        if (res.success) setProfile(res.user);
        else setNotFound(true);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));

    // Lấy sản phẩm đang bán + đánh giá nhận được (song song, không chặn render hồ sơ)
    productService.getUserProducts(id, { limit: 8 })
      .then((res) => { if (res.success) setProducts(res.data || []); })
      .catch(() => setProducts([]));

    reviewService.getUserReviews(id)
      .then((res) => {
        if (res.success) {
          setReviews(res.data || []);
          setReviewMeta({ averageRating: res.averageRating || 0, count: res.count || 0 });
        }
      })
      .catch(() => { setReviews([]); setReviewMeta({ averageRating: 0, count: 0 }); });
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center">
        <span className="material-symbols-outlined animate-spin text-3xl text-primary">refresh</span>
      </div>
    );
  }

  if (notFound || !profile) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] flex flex-col items-center justify-center gap-4 text-on-surface-variant">
        <span className="material-symbols-outlined text-6xl opacity-30">person_off</span>
        <p className="font-semibold text-lg">Không tìm thấy người dùng</p>
        <Link to="/marketplace" className="text-sm text-primary font-medium hover:underline">
          Quay lại Marketplace
        </Link>
      </div>
    );
  }

  const displayName = profile.fullName || "Người dùng";
  const verBadge = VER_BADGE[profile.verificationStatus] || VER_BADGE.unverified;
  const accBadge = ACC_BADGE[profile.accountStatus] || ACC_BADGE.active;
  const reputation = profile.reputationScore ?? 100;
  const roleLabel = { admin: "Quản trị viên", shipper: "Shipper", user: "Người dùng" }[profile.role] || "Người dùng";
  const joinedAt = profile.createdAt ? new Date(profile.createdAt).toLocaleDateString("vi-VN", { month: "long", year: "numeric" }) : null;

  const statCards = [
    { label: "Điểm uy tín", value: reputation, icon: "verified_user", color: reputation < 50 ? "text-error" : "text-primary" },
    { label: "Đánh giá TB", value: reviewMeta.count ? `${reviewMeta.averageRating.toFixed(1)} ★` : "Chưa có", icon: "star", color: "text-amber-500" },
    { label: "Lượt đánh giá", value: reviewMeta.count, icon: "reviews", color: "text-primary" },
    { label: "Đang bán", value: products.length, icon: "sell", color: "text-secondary" },
  ];

  return (
    <div className="min-h-screen bg-[#F5F5F7] py-10 px-4">
      <div className="max-w-4xl mx-auto">

        {/* Back */}
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1.5 text-sm text-on-surface-variant hover:text-on-surface mb-6 transition-colors">
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Quay lại
        </button>

        {/* Hero card */}
        <div className="relative bg-gradient-to-r from-primary to-primary-fixed rounded-2xl p-8 mb-6 overflow-hidden shadow-lg">
          <div className="absolute top-0 right-0 w-56 h-56 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center gap-6">
            {/* Avatar */}
            <div className="w-20 h-20 rounded-full bg-white/20 border-2 border-white/40 flex items-center justify-center text-white text-3xl font-black shadow-lg flex-shrink-0">
              {profile.avatarUrl
                ? <img src={profile.avatarUrl} alt={displayName} className="w-full h-full rounded-full object-cover" />
                : displayName.charAt(0).toUpperCase()}
            </div>

            {/* Info */}
            <div className="flex-1">
              <p className="text-white/70 text-xs font-semibold uppercase tracking-widest mb-1">Hồ sơ người dùng</p>
              <h1 className="text-2xl font-black text-white">{displayName}</h1>
              <p className="text-white/70 text-sm mt-0.5">{roleLabel}</p>
              <div className="flex flex-wrap items-center gap-2 mt-3">
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${verBadge.cls}`}>
                  {verBadge.label}
                </span>
                <span className={`text-xs font-medium ${accBadge.cls}`}>
                  {accBadge.label}
                </span>
                {joinedAt && (
                  <span className="text-xs text-white/70 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                    Tham gia {joinedAt}
                  </span>
                )}
              </div>
            </div>

            {/* Reputation */}
            <div className="bg-white/10 backdrop-blur border border-white/20 rounded-xl p-5 text-center min-w-[130px]">
              <p className="text-white/70 text-xs font-medium mb-1">Điểm uy tín</p>
              <p className={`text-4xl font-black ${reputation < 50 ? "text-red-300" : "text-white"}`}>
                {reputation}
              </p>
              <div className="mt-2 h-1.5 bg-white/20 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${reputation < 50 ? "bg-red-400" : "bg-white"}`}
                  style={{ width: `${Math.min(reputation, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {statCards.map((s) => (
            <div key={s.label} className="bg-surface-container-lowest rounded-2xl p-4 text-center shadow-apple border border-surface-variant/30">
              <span className={`material-symbols-outlined text-2xl mb-2 ${s.color}`}>{s.icon}</span>
              <p className="font-bold text-on-surface text-sm">{s.value}</p>
              <p className="text-xs text-on-surface-variant mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Banned warning */}
        {profile.accountStatus === "banned" && (
          <div className="bg-error-container/40 border border-error/30 rounded-xl p-4 flex items-start gap-3 mb-6">
            <span className="material-symbols-outlined text-error flex-shrink-0">block</span>
            <div>
              <p className="font-semibold text-error">Tài khoản bị khóa</p>
              <p className="text-sm text-on-error-container mt-0.5">
                Người dùng này không thể thực hiện giao dịch trên EcoTrade.
              </p>
            </div>
          </div>
        )}

        {/* Sản phẩm đang bán */}
        <section className="bg-surface-container-lowest rounded-2xl shadow-apple border border-surface-variant/30 overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-surface-variant/30 bg-surface-bright/40 flex items-center justify-between">
            <h2 className="font-bold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[20px]">storefront</span>
              Sản phẩm đang bán
            </h2>
            <span className="text-xs text-on-surface-variant">{products.length} sản phẩm</span>
          </div>
          {products.length === 0 ? (
            <div className="p-10 text-center text-on-surface-variant text-sm">
              <span className="material-symbols-outlined text-4xl opacity-30 block mb-2">inventory_2</span>
              Người dùng này chưa có sản phẩm nào đang bán.
            </div>
          ) : (
            <div className="p-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {products.map((p) => {
                const price = p.productType === "rent" ? `${formatPrice(p.rentPricePerDay)}/ngày` : formatPrice(p.salePrice);
                return (
                  <Link key={p._id} to={`/san-pham/${p._id}`}
                    className="group bg-surface-container-low rounded-xl overflow-hidden border border-surface-variant/30 hover:shadow-md hover:-translate-y-0.5 transition-all">
                    <div className="aspect-square bg-surface-container overflow-hidden">
                      {p.thumbnailUrl ? (
                        <img src={p.thumbnailUrl} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="material-symbols-outlined text-3xl text-on-surface-variant/30">image</span>
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <h3 className="text-sm font-medium text-on-surface line-clamp-2 leading-tight mb-1 group-hover:text-primary transition-colors">{p.title}</h3>
                      <p className="text-primary font-bold text-sm">{price}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* Đánh giá nhận được */}
        <section className="bg-surface-container-lowest rounded-2xl shadow-apple border border-surface-variant/30 overflow-hidden">
          <div className="px-6 py-4 border-b border-surface-variant/30 bg-surface-bright/40 flex items-center justify-between">
            <h2 className="font-bold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-amber-500 text-[20px]">star</span>
              Đánh giá nhận được
            </h2>
            {reviewMeta.count > 0 && (
              <span className="text-xs text-on-surface-variant">
                {reviewMeta.averageRating.toFixed(1)} ★ · {reviewMeta.count} đánh giá
              </span>
            )}
          </div>
          {reviews.length === 0 ? (
            <div className="p-10 text-center text-on-surface-variant text-sm">
              <span className="material-symbols-outlined text-4xl opacity-30 block mb-2">reviews</span>
              Chưa có đánh giá nào.
            </div>
          ) : (
            <div className="divide-y divide-surface-variant/30">
              {reviews.map((r) => (
                <div key={r._id} className="px-6 py-4 flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {r.reviewerId?.avatarUrl
                      ? <img src={r.reviewerId.avatarUrl} alt="" className="w-full h-full object-cover" />
                      : <span className="material-symbols-outlined text-[18px] text-primary">person</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-on-surface text-sm">{r.reviewerId?.fullName || "Người dùng"}</span>
                      <span className="flex items-center text-amber-500 text-xs">
                        {"★".repeat(r.rating)}<span className="text-surface-variant">{"★".repeat(Math.max(0, 5 - r.rating))}</span>
                      </span>
                      <span className="text-xs text-on-surface-variant">{new Date(r.createdAt).toLocaleDateString("vi-VN")}</span>
                    </div>
                    {r.postId?.title && (
                      <p className="text-xs text-on-surface-variant mt-0.5">Về: {r.postId.title}</p>
                    )}
                    {r.comment && <p className="text-sm text-on-surface mt-1 leading-relaxed">{r.comment}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default PublicProfile;
