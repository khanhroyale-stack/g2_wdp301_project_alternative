import { useState, useEffect } from "react";
import Sidebar from "../../components/Sidebar";
import productService from "../../services/product.service";

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

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const res = await productService.adminGetProducts(STATUS_FILTER[tab]);
      if (res.success) setPosts(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const handleApprove = async (id) => {
    try {
      const res = await productService.adminApproveProduct(id);
      if (res.success) fetchPosts();
    } catch (err) {
      alert(err.response?.data?.message || "Lỗi khi duyệt bài");
    }
  };

  const handleReject = async () => {
    try {
      if (!rejectReason) return alert("Vui lòng nhập lý do từ chối");

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
      alert(err.response?.data?.message || "Lỗi khi từ chối bài");
    }
  };

  const handleStatusChange = async (id, status, reason = "") => {
    try {
      const res = await productService.adminChangeStatus(id, status, reason);
      if (res.success) fetchPosts();
    } catch (err) {
      alert(err.response?.data?.message || "Lỗi khi đổi trạng thái");
    }
  };

  const getImageUrl = (img) => {
    if (!img) return null;
    if (img.startsWith("http")) return img;
    return `http://localhost:5000${img}`;
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

      {showDetailModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4 overflow-y-auto py-8">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl border border-surface-variant/20">
            <div className="p-8">
              <div className="flex items-start justify-between gap-6 mb-6">
                <div className="flex-1">
                  <h2 className="text-2xl font-extrabold text-on-surface mb-2">{showDetailModal.title}</h2>
                  <p className="text-sm text-on-surface-variant">
                    Tạo lúc: {new Date(showDetailModal.createdAt).toLocaleString("vi-VN")}
                  </p>
                </div>
                <button onClick={() => setShowDetailModal(null)} className="p-2 hover:bg-surface-container-low rounded-xl transition-all text-on-surface-variant">
                  <span className="material-symbols-outlined text-2xl">close</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  {showDetailModal.thumbnailUrl ? (
                    <img
                      src={getImageUrl(showDetailModal.thumbnailUrl)}
                      alt={showDetailModal.title}
                      className="w-full h-64 object-cover rounded-2xl shadow-inner"
                    />
                  ) : (
                    <div className="w-full h-64 bg-surface-container-low rounded-2xl flex items-center justify-center">
                      <span className="material-symbols-outlined text-6xl text-on-surface-variant">image</span>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-on-surface-variant uppercase tracking-wider mb-1">Thông tin người đăng</h3>
                    <p className="text-base text-on-surface font-semibold">{showDetailModal.ownerId?.fullName || "N/A"}</p>
                    {showDetailModal.ownerId?.email && <p className="text-sm text-on-surface-variant">{showDetailModal.ownerId.email}</p>}
                    {showDetailModal.ownerId?.phone && <p className="text-sm text-on-surface-variant">Điện thoại: {showDetailModal.ownerId.phone}</p>}
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-on-surface-variant uppercase tracking-wider mb-1">Danh mục & loại</h3>
                    <p className="text-base text-on-surface">{showDetailModal.categoryId?.name || "N/A"} • {showDetailModal.productType === "rent" ? "Cho thuê" : "Bán"}</p>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-on-surface-variant uppercase tracking-wider mb-1">Giá</h3>
                    <p className="text-2xl font-black text-primary">{formatPrice(showDetailModal.productType === "rent" ? showDetailModal.rentPricePerDay : showDetailModal.salePrice)}</p>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-on-surface-variant uppercase tracking-wider mb-1">Vị trí</h3>
                    <p className="text-base text-on-surface">{showDetailModal.location || "Không xác định"}</p>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-on-surface-variant uppercase tracking-wider mb-1">Tình trạng sản phẩm</h3>
                    <p className="text-base text-on-surface">{showDetailModal.conditionStatus || "N/A"}</p>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <h3 className="text-sm font-bold text-on-surface-variant uppercase tracking-wider mb-2">Mô tả</h3>
                <p className="text-base text-on-surface leading-relaxed whitespace-pre-line">{showDetailModal.description || "Không có mô tả"}</p>
              </div>

              {showDetailModal.postStatus === "rejected" && showDetailModal.rejectReason && (
                <div className="mt-6 p-4 bg-error-container/30 border border-error/30 rounded-xl">
                  <h4 className="font-semibold text-error mb-1">Lý do từ chối:</h4>
                  <p className="text-sm text-error">{showDetailModal.rejectReason}</p>
                </div>
              )}
            </div>

            <div className="px-8 pb-8 pt-4 border-t border-surface-variant/20">
              <div className="flex flex-wrap gap-3 justify-end">
                <button onClick={() => setShowDetailModal(null)}
                  className="px-6 py-2.5 border-2 border-surface-variant/30 rounded-full text-base font-bold hover:bg-surface-container transition-all text-on-surface-variant">
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PostApprovals;
