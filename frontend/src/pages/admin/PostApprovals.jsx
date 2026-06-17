import { useState, useEffect } from "react";
import Sidebar from "../../components/Sidebar";
import productService from "../../services/product.service";

const STATUS_FILTER = ["pending", "approved", "rejected", "closed"];
const STATUS_MAP = {
  PENDING: { label: "Chờ duyệt", color: "bg-surface-container text-on-surface-variant" },
  ACTIVE: { label: "Đang hiển thị", color: "bg-secondary-container text-on-secondary-container" },
  REJECTED: { label: "Từ chối", color: "bg-error-container text-on-error-container" },
  HIDDEN: { label: "Đã ẩn", color: "bg-surface-container-highest text-on-surface-variant" },
};

const PostApprovals = () => {
  const [tab, setTab] = useState(0);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(null);
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
      if (res.success) {
        fetchPosts();
      }
    } catch (err) {
      alert(err.response?.data?.message || "Lỗi khi duyệt bài");
    }
  };

  const handleReject = async () => {
    try {
      if (!rejectReason) return alert("Vui lòng nhập lý do từ chối");
      const res = await productService.adminRejectProduct(showModal._id, rejectReason);
      if (res.success) {
        setShowModal(null);
        setRejectReason("");
        fetchPosts();
      }
    } catch (err) {
      alert(err.response?.data?.message || "Lỗi khi từ chối bài");
    }
  };

  const getImageUrl = (img) => {
    if (!img) return null;
    if (img.startsWith("http")) return img;
    return `http://localhost:5000${img}`;
  };

  const formatPrice = (num) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num || 0);

  return (
    <div className="flex min-h-screen bg-[#F5F5F7]">
      <Sidebar variant="admin" />
      <main className="flex-1 md:ml-64 px-4 md:px-10 py-10">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold text-on-surface mb-8">Duyệt bài đăng</h1>
          <div className="flex gap-1 bg-surface-container rounded-xl p-1 w-fit mb-8">
            {["Chờ duyệt", "Đang hiển thị", "Từ chối", "Đã ẩn"].map((t, i) => (
              <button key={t} onClick={() => setTab(i)}
                className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${tab === i ? "bg-surface-container-lowest text-on-surface shadow-sm" : "text-on-surface-variant hover:text-on-surface"
                  }`}>
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
                const s = STATUS_MAP[post.status];
                const displayPrice = post.listingType === "cho-thue" ? `${formatPrice(post.rentalPricePerDay)}/ngày` : formatPrice(post.salePrice);

                return (
                  <div key={post._id} className="bg-surface-container-lowest rounded-2xl shadow-apple border border-surface-variant/30 p-5">
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 rounded-xl overflow-hidden bg-surface-container-low flex-shrink-0">
                        {post.images?.[0]
                          ? <img src={getImageUrl(post.images[0])} alt="" className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center">
                            <span className="material-symbols-outlined text-on-surface-variant">image</span>
                          </div>
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-semibold text-on-surface">{post.title}</p>
                            <p className="text-sm text-on-surface-variant mt-0.5">
                              {post.seller?.name || "N/A"} • {post.category?.name || "N/A"} • {post.listingType === "cho-thue" ? "Cho thuê" : "Bán"}
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
                    {post.status === "PENDING" && (
                      <div className="flex gap-3 mt-4 pt-4 border-t border-surface-variant/40">
                        <button onClick={() => handleApprove(post._id)}
                          className="px-5 py-2 bg-primary text-on-primary rounded-lg text-sm font-semibold hover:opacity-90 transition-all">
                          ✓ Duyệt bài
                        </button>
                        <button onClick={() => setShowModal(post)}
                          className="px-5 py-2 border border-error/30 text-error rounded-lg text-sm font-semibold hover:bg-error/5 transition-all">
                          ✗ Từ chối
                        </button>
                        <button className="px-5 py-2 border border-surface-variant text-on-surface-variant rounded-lg text-sm font-medium hover:bg-surface-container-low transition-all">
                          Xem chi tiết
                        </button>
                      </div>
                    )}
                    {post.status === "REJECTED" && (
                      <div className="mt-4 pt-4 border-t border-surface-variant/40">
                        <p className="text-sm text-error"><strong>Lý do từ chối:</strong> {post.rejectedReason}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Modal từ chối */}
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
    </div>
  );
};
export default PostApprovals;
