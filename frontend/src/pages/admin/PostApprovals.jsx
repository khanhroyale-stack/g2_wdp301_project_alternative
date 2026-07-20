import { useState, useEffect, useCallback } from "react";
import Sidebar from "../../components/Sidebar";
import useRealtimeRefresh from "../../hooks/useRealtimeRefresh";
import productService from "../../services/product.service";
import toast from "react-hot-toast";

const STATUS_FILTER = ["pending", "approved", "rejected", "closed"];
const STATUS_MAP = {
  pending: { label: "Chờ duyệt", color: "bg-surface-container text-on-surface-variant" },
  approved: { label: "Đang hiển thị", color: "bg-secondary-container text-on-secondary-container" },
  rejected: { label: "Từ chối", color: "bg-error-container text-on-error-container" },
  closed: { label: "Đã ẩn", color: "bg-surface-container-highest text-on-surface-variant" },
};

const PostApprovals = () => {
  const [tab, setTab] = useState(0);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(null);
  const [rejectReason, setRejectReason] = useState("");

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await productService.adminGetProducts(STATUS_FILTER[tab]);
      if (res.success) setPosts(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);
  useRealtimeRefresh("product", fetchPosts);

  const handleApprove = async (id) => {
    try {
      const res = await productService.adminApproveProduct(id);
      if (res.success) fetchPosts();
    } catch (err) {
      toast.error(err.response?.data?.message || "Lỗi khi duyệt bài");
    }
  };

  const handleReject = async () => {
    try {
      if (!rejectReason) return toast.error("Vui lòng nhập lý do từ chối");

      let res;
      if (showModal.postStatus && showModal.postStatus !== "pending") {
        res = await productService.adminChangeStatus(showModal._id, "rejected", rejectReason);
      } else {
        res = await productService.adminRejectProduct(showModal._id, rejectReason);
      }

      if (res.success) {
        setShowModal(null);
        setRejectReason("");
        fetchPosts();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Lỗi khi từ chối bài");
    }
  };

  const handleStatusChange = async (id, status, reason = "") => {
    try {
      const res = await productService.adminChangeStatus(id, status, reason);
      if (res.success) fetchPosts();
    } catch (err) {
      toast.error(err.response?.data?.message || "Lỗi khi đổi trạng thái");
    }
  };

  const getImageUrl = (img) => {
    if (!img) return null;
    return img;
  };

  const formatPrice = (num) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(num || 0);

  return (
    <div className="flex min-h-screen bg-[#F5F5F7]">
      <Sidebar variant="admin" />
      <main className="flex-1 md:ml-72 px-4 md:px-10 py-10">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold text-on-surface mb-8">Duyệt bài đăng</h1>
          <div className="flex gap-1 bg-surface-container rounded-xl p-1 w-fit mb-8">
            {["Chờ duyệt", "Đang hiển thị", "Từ chối", "Đã ẩn"].map((t, i) => (
              <button key={t} onClick={() => setTab(i)}
                className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${tab === i ? "bg-surface-container-lowest text-on-surface shadow-sm" : "text-on-surface-variant hover:text-on-surface"}`}>
                {t}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="text-center py-16 text-on-surface-variant">Đang tải...</div>
          ) : posts.length === 0 ? (
            <div className="text-center py-16 text-on-surface-variant">
              <span className="material-symbols-outlined text-5xl block mb-3">inbox</span>
              <p className="text-sm">Không có bài đăng nào trong mục này.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {posts.map((post) => {
                const s = STATUS_MAP[post.postStatus] || { label: post.postStatus, color: "bg-surface-variant text-on-surface" };
                const displayPrice = post.productType === "rent"
                  ? `${formatPrice(post.rentPricePerDay)}/ngày`
                  : formatPrice(post.salePrice);

                return (
                  <div key={post._id} className="bg-surface-container-lowest rounded-2xl shadow-apple border border-surface-variant/30 p-5">
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 rounded-xl overflow-hidden bg-surface-container-low flex-shrink-0">
                        {post.thumbnailUrl
                          ? <img src={getImageUrl(post.thumbnailUrl)} alt="" className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center">
                            <span className="material-symbols-outlined text-on-surface-variant">image</span>
                          </div>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-semibold text-on-surface">{post.title}</p>
                            <p className="text-sm text-on-surface-variant mt-0.5">
                              {post.ownerId?.fullName || "N/A"} • {post.categoryId?.name || "N/A"} • {post.productType === "rent" ? "Cho thuê" : "Bán"}
                            </p>
                            <p className="text-sm font-semibold text-primary mt-1">{displayPrice}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs px-2.5 py-1 rounded-full font-semibold flex-shrink-0 ${s.color}`}>{s.label}</span>
                            <span className="text-xs text-on-surface-variant">{new Date(post.createdAt).toLocaleDateString("vi-VN")}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 mt-4 pt-4 border-t border-surface-variant/40">
                      {post.postStatus === "rejected" && post.rejectReason && (
                        <p className="text-sm text-error mb-1"><strong>Lý do từ chối:</strong> {post.rejectReason}</p>
                      )}

                      <div className="flex flex-wrap gap-2.5">
                        <button onClick={() => setShowDetailModal(post)}
                          className="px-4 py-2 border border-surface-variant text-on-surface-variant rounded-lg text-sm font-medium hover:bg-surface-container-low transition-all flex items-center gap-1">
                          <span className="material-symbols-outlined text-[16px]">visibility</span>
                          Xem chi tiết
                        </button>

                        {post.postStatus === "pending" && (
                          <>
                            <button onClick={() => handleApprove(post._id)}
                              className="px-4 py-2 bg-primary text-on-primary rounded-lg text-sm font-semibold hover:opacity-90 transition-all">
                              Duyệt bài
                            </button>
                            <button onClick={() => setShowModal(post)}
                              className="px-4 py-2 border border-error/30 text-error rounded-lg text-sm font-semibold hover:bg-error/5 transition-all">
                              Từ chối
                            </button>
                          </>
                        )}

                        {post.postStatus === "approved" && (
                          <>
                            <button onClick={() => handleStatusChange(post._id, "pending")}
                              className="px-4 py-2 border border-amber-500/30 text-amber-600 rounded-lg text-sm font-semibold hover:bg-amber-500/5 transition-all">
                              Đưa về chờ duyệt
                            </button>
                            <button onClick={() => setShowModal(post)}
                              className="px-4 py-2 border border-error/30 text-error rounded-lg text-sm font-semibold hover:bg-error/5 transition-all">
                              Từ chối
                            </button>
                            <button onClick={() => handleStatusChange(post._id, "closed")}
                              className="px-4 py-2 border border-surface-variant text-on-surface-variant/80 rounded-lg text-sm font-semibold hover:bg-surface-container-low transition-all">
                              Ẩn bài
                            </button>
                          </>
                        )}

                        {post.postStatus === "rejected" && (
                          <>
                            <button onClick={() => handleApprove(post._id)}
                              className="px-4 py-2 bg-primary text-on-primary rounded-lg text-sm font-semibold hover:opacity-90 transition-all">
                              Duyệt & hiển thị
                            </button>
                            <button onClick={() => handleStatusChange(post._id, "pending")}
                              className="px-4 py-2 border border-amber-500/30 text-amber-600 rounded-lg text-sm font-semibold hover:bg-amber-500/5 transition-all">
                              Đưa về chờ duyệt
                            </button>
                            <button onClick={() => handleStatusChange(post._id, "closed")}
                              className="px-4 py-2 border border-surface-variant text-on-surface-variant/80 rounded-lg text-sm font-semibold hover:bg-surface-container-low transition-all">
                              Ẩn bài
                            </button>
                          </>
                        )}

                        {post.postStatus === "closed" && (
                          <>
                            <button onClick={() => handleApprove(post._id)}
                              className="px-4 py-2 bg-primary text-on-primary rounded-lg text-sm font-semibold hover:opacity-90 transition-all">
                              Duyệt & hiển thị
                            </button>
                            <button onClick={() => handleStatusChange(post._id, "pending")}
                              className="px-4 py-2 border border-amber-500/30 text-amber-600 rounded-lg text-sm font-semibold hover:bg-amber-500/5 transition-all">
                              Đưa về chờ duyệt
                            </button>
                            <button onClick={() => setShowModal(post)}
                              className="px-4 py-2 border border-error/30 text-error rounded-lg text-sm font-semibold hover:bg-error/5 transition-all">
                              Từ chối
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-apple-md border border-surface-variant w-full max-w-md">
            <h3 className="font-bold text-on-surface mb-1">Từ chối bài đăng</h3>
            <p className="text-sm text-on-surface-variant mb-4">&quot;{showModal.title}&quot;</p>
            <label className="block text-sm font-medium text-on-surface mb-1.5">Lý do từ chối</label>
            <textarea
              className="w-full px-4 py-3 border border-surface-variant rounded-xl text-sm bg-surface-bright focus:border-error outline-none resize-none min-h-[100px]"
              placeholder="VD: Ảnh không rõ nét, mô tả thiếu thông tin, sản phẩm không phù hợp..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
            <div className="flex gap-3 mt-4">
              <button onClick={() => { setShowModal(null); setRejectReason(""); }}
                className="flex-1 py-2.5 border border-surface-variant rounded-xl text-sm font-medium hover:bg-surface-container-low transition-all">
                Hủy
              </button>
              <button className="flex-1 py-2.5 bg-error text-on-error rounded-xl text-sm font-semibold hover:opacity-90 transition-all"
                onClick={handleReject}>
                Xác nhận từ chối
              </button>
            </div>
          </div>
        </div>
      )}

      {showDetailModal && (() => {
        const post = showDetailModal;
        const s = STATUS_MAP[post.postStatus] || { label: post.postStatus, color: "bg-surface-variant text-on-surface" };
        const images = post.images?.length > 0 ? post.images : post.thumbnailUrl ? [post.thumbnailUrl] : [];
        const [activeImg, setActiveImg] = [post._activeImg ?? 0, (idx) => setShowDetailModal({ ...post, _activeImg: idx })];
        const conditionLabel = post.conditionStatus === "new" ? "Mới 100%" : post.conditionStatus === "like_new" ? "Như mới" : post.conditionStatus === "good" ? "Đã dùng – Còn tốt" : post.conditionStatus === "fair" ? "Đã dùng – Có lỗi nhỏ" : post.conditionStatus || "N/A";
        const isRent = post.productType === "rent";

        return (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center z-50 px-4 py-8 overflow-y-auto">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl border border-surface-variant/20 my-auto">

              {/* Header */}
              <div className="flex items-start justify-between gap-4 px-8 pt-7 pb-5 border-b border-surface-variant/20">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wide flex-shrink-0 ${s.color}`}>{s.label}</span>
                    <span className="text-xs text-on-surface-variant">{new Date(post.createdAt).toLocaleString("vi-VN")}</span>
                  </div>
                  <h2 className="text-xl font-extrabold text-on-surface leading-tight">{post.title}</h2>
                </div>
                <button onClick={() => setShowDetailModal(null)} className="p-2 hover:bg-surface-container-low rounded-xl transition-all text-on-surface-variant flex-shrink-0">
                  <span className="material-symbols-outlined text-2xl">close</span>
                </button>
              </div>

              <div className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                  {/* Left: Image gallery */}
                  <div className="flex flex-col gap-3">
                    <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-surface-container-low">
                      {images.length > 0 ? (
                        <img
                          src={images[activeImg]}
                          alt={post.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="material-symbols-outlined text-5xl text-on-surface-variant">image</span>
                        </div>
                      )}
                      {images.length > 1 && (
                        <>
                          <button
                            type="button"
                            onClick={() => setActiveImg((activeImg - 1 + images.length) % images.length)}
                            className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition"
                          >
                            <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setActiveImg((activeImg + 1) % images.length)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition"
                          >
                            <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                          </button>
                          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                            {images.map((_, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => setActiveImg(idx)}
                                className={`rounded-full transition-all ${activeImg === idx ? "w-4 h-1.5 bg-white" : "w-1.5 h-1.5 bg-white/50"}`}
                              />
                            ))}
                          </div>
                        </>
                      )}
                    </div>

                    {/* Thumbnail strip */}
                    {images.length > 1 && (
                      <div className="flex gap-2 overflow-x-auto pb-1">
                        {images.map((img, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setActiveImg(idx)}
                            className={`flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${activeImg === idx ? "border-primary scale-105 shadow" : "border-transparent opacity-70 hover:opacity-100"}`}
                          >
                            <img src={img} alt="" className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    )}

                    <div className="text-xs text-on-surface-variant text-center">
                      {images.length} ảnh • Ảnh {activeImg + 1}/{images.length || 1}
                    </div>
                  </div>

                  {/* Right: Product details */}
                  <div className="space-y-5">
                    {/* Seller info */}
                    <div className="rounded-xl bg-surface-container-low p-4">
                      <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Người đăng</h3>
                      <p className="font-semibold text-on-surface">{post.ownerId?.fullName || "N/A"}</p>
                      {post.ownerId?.email && <p className="text-sm text-on-surface-variant mt-0.5">{post.ownerId.email}</p>}
                      {post.ownerId?.phone && <p className="text-sm text-on-surface-variant">📞 {post.ownerId.phone}</p>}
                    </div>

                    {/* Category & type */}
                    <div>
                      <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">Danh mục & Loại bài</h3>
                      <div className="flex flex-wrap gap-2">
                        <span className="inline-flex items-center rounded-full bg-secondary/10 px-3 py-1 text-sm font-semibold text-secondary">
                          {post.categoryId?.name || "Chưa có danh mục"}
                        </span>
                        <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
                          {isRent ? "Cho thuê" : "Bán"}
                        </span>
                      </div>
                    </div>

                    {/* Condition */}
                    <div>
                      <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">Tình trạng sản phẩm</h3>
                      <p className="text-sm font-semibold text-on-surface">{conditionLabel}</p>
                    </div>

                    {/* Quantity */}
                    <div>
                      <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">Số lượng</h3>
                      <p className="text-sm font-semibold text-on-surface">{post.quantity ?? 1} sản phẩm</p>
                    </div>

                    {/* Price */}
                    <div>
                      <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">
                        {isRent ? "Giá thuê / ngày" : "Giá bán"}
                      </h3>
                      <p className="text-2xl font-black text-primary">
                        {formatPrice(isRent ? post.rentPricePerDay : post.salePrice)}
                        {isRent && <span className="text-sm font-semibold text-on-surface-variant ml-1">/ngày</span>}
                      </p>
                    </div>

                    {/* Location */}
                    <div>
                      <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">Vị trí</h3>
                      <p className="text-sm text-on-surface flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px] text-on-surface-variant">location_on</span>
                        {post.location || "Không xác định"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="mt-7 border-t border-surface-variant/30 pt-6">
                  <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-3">Mô tả sản phẩm</h3>
                  <div className="text-sm text-on-surface leading-7 whitespace-pre-line bg-surface-container-low rounded-xl p-4">
                    {post.description || <span className="text-on-surface-variant italic">Không có mô tả</span>}
                  </div>
                </div>

                {/* Reject reason if any */}
                {post.postStatus === "rejected" && post.rejectReason && (
                  <div className="mt-5 p-4 bg-error-container/30 border border-error/30 rounded-xl">
                    <h4 className="font-semibold text-error mb-1 text-sm">Lý do từ chối:</h4>
                    <p className="text-sm text-error">{post.rejectReason}</p>
                  </div>
                )}
              </div>

              {/* Footer actions */}
              <div className="px-8 pb-7 pt-4 border-t border-surface-variant/20">
                <div className="flex flex-wrap items-center gap-3 justify-between">
                  <button
                    onClick={() => setShowDetailModal(null)}
                    className="px-5 py-2.5 border border-surface-variant/60 rounded-full text-sm font-semibold text-on-surface-variant hover:bg-surface-container-low transition-all"
                  >
                    Đóng
                  </button>
                  <div className="flex flex-wrap gap-3">
                    {post.postStatus === "pending" && (
                      <>
                        <button
                          onClick={() => { setShowDetailModal(null); setShowModal(post); }}
                          className="px-5 py-2.5 border border-error/40 text-error rounded-full text-sm font-semibold hover:bg-error/5 transition-all"
                        >
                          Từ chối
                        </button>
                        <button
                          onClick={() => { handleApprove(post._id); setShowDetailModal(null); }}
                          className="px-5 py-2.5 bg-primary text-on-primary rounded-full text-sm font-semibold hover:opacity-90 transition-all"
                        >
                          ✓ Duyệt bài
                        </button>
                      </>
                    )}
                    {post.postStatus === "approved" && (
                      <>
                        <button
                          onClick={() => { setShowDetailModal(null); setShowModal(post); }}
                          className="px-5 py-2.5 border border-error/40 text-error rounded-full text-sm font-semibold hover:bg-error/5 transition-all"
                        >
                          Từ chối
                        </button>
                        <button
                          onClick={() => { handleStatusChange(post._id, "closed"); setShowDetailModal(null); }}
                          className="px-5 py-2.5 border border-surface-variant text-on-surface-variant/80 rounded-full text-sm font-semibold hover:bg-surface-container-low transition-all"
                        >
                          Ẩn bài
                        </button>
                      </>
                    )}
                    {(post.postStatus === "rejected" || post.postStatus === "closed") && (
                      <button
                        onClick={() => { handleApprove(post._id); setShowDetailModal(null); }}
                        className="px-5 py-2.5 bg-primary text-on-primary rounded-full text-sm font-semibold hover:opacity-90 transition-all"
                      >
                        ✓ Duyệt & Hiển thị
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

    </div>
  );
};

export default PostApprovals;
