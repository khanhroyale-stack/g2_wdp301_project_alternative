import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import productService from "../../services/product.service";
import toast from "react-hot-toast";

const STATUS = {
  pending: { label: "Chờ duyệt",     color: "bg-surface-container text-on-surface-variant" },
  approved: { label: "Đang hiển thị", color: "bg-secondary-container text-on-secondary-container" },
  rejected: { label: "Bị từ chối",    color: "bg-error-container text-on-error-container" },
  closed:   { label: "Đã đóng",       color: "bg-surface-container-high text-on-surface" },
};

const MyPosts = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingQty, setEditingQty] = useState(null); // postId đang edit
  const [qtyValue, setQtyValue] = useState(1);
  const [savingQty, setSavingQty] = useState(false);

  const fetchPosts = async () => {
    try {
      const res = await productService.getMyProducts();
      if (res.success) setPosts(res.data);
    } catch (err) {
      console.error("Lỗi khi tải bài đăng:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPosts(); }, []);

  const handleHide = async (postId) => {
    try {
      await productService.deleteProduct(postId);
      toast.success("Đã ẩn bài đăng");
      fetchPosts();
    } catch {
      toast.error("Lỗi khi ẩn bài");
    }
  };

  const handleSaveQty = async (postId) => {
    if (!qtyValue || qtyValue < 1) return toast.error("Số lượng phải >= 1");
    setSavingQty(true);
    try {
      await productService.updateProduct(postId, { quantity: Number(qtyValue) });
      toast.success("Đã cập nhật số lượng");
      setEditingQty(null);
      fetchPosts();
    } catch {
      toast.error("Lỗi cập nhật số lượng");
    } finally {
      setSavingQty(false); }
  };

  const getImageUrl = (img) => {
    if (!img) return "https://via.placeholder.com/120?text=No+Image";
    if (img.startsWith("http")) return img;
    return `http://localhost:5000${img}`;
  };

  const formatPrice = (num) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num || 0);

  return (
    <div className="flex min-h-screen bg-[#F5F5F7]">
      <Sidebar variant="user" />
      <main className="flex-1 md:ml-64 px-4 md:px-10 py-10">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-on-surface">Bài đăng của tôi</h1>
              <p className="text-on-surface-variant text-sm mt-1">{posts.length} bài đăng</p>
            </div>
            <Link to="/dang-tin"
              className="flex items-center gap-1.5 px-5 py-2.5 bg-primary text-on-primary rounded-full text-sm font-semibold hover:opacity-90 transition-all shadow-sm">
              <span className="material-symbols-outlined text-[18px]">add</span>Đăng tin mới
            </Link>
          </div>

          <div className="bg-surface-container-lowest rounded-2xl shadow-apple border border-surface-variant/30 overflow-hidden">
            {loading ? (
              <div className="p-10 text-center text-on-surface-variant">Đang tải...</div>
            ) : posts.length === 0 ? (
              <div className="p-10 text-center text-on-surface-variant">
                Bạn chưa có bài đăng nào. <Link to="/dang-tin" className="text-primary hover:underline">Đăng tin ngay</Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-surface-bright/70 border-b border-surface-variant/50">
                    <tr>
                      {["Sản phẩm", "Danh mục", "Loại", "Giá", "Số lượng", "Ngày đăng", "Trạng thái", ""].map((h) => (
                        <th key={h} className="px-4 py-3.5 text-xs font-bold text-on-surface-variant uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-variant/30">
                    {posts.map((post) => {
                      const s = STATUS[post.postStatus] || { label: post.postStatus, color: "bg-surface-variant text-on-surface" };
                      const typeLabel = post.productType === "rent" ? "Cho thuê" : "Bán";
                      const displayPrice = post.productType === "rent" ? `${formatPrice(post.rentPricePerDay)}/ngày` : formatPrice(post.salePrice);
                      
                      return (
                        <tr key={post._id} className="hover:bg-surface-bright/40 transition-colors group">
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-lg overflow-hidden bg-surface-container-low flex-shrink-0">
                                <img src={getImageUrl(post.thumbnailUrl)} alt="" className="w-full h-full object-cover" />
                              </div>
                              <Link to={`/san-pham/${post._id}`} className="font-semibold text-on-surface text-sm hover:text-primary transition-colors line-clamp-2 max-w-[180px]">
                                {post.title}
                              </Link>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-sm text-on-surface-variant">{post.categoryId?.name || "N/A"}</td>
                          <td className="px-4 py-4">
                            <span className="text-xs px-2.5 py-1 rounded-full bg-surface-container text-on-surface-variant">{typeLabel}</span>
                          </td>
                          <td className="px-4 py-4 text-sm font-semibold text-primary">{displayPrice}</td>
                          {/* Số lượng — chỉ hiện cho sản phẩm thuê */}
                          <td className="px-4 py-4 text-sm text-center">
                            {(post.productType === "rent" || post.productType === "both") ? (
                              editingQty === post._id ? (
                                <div className="flex items-center gap-1 justify-center">
                                  <input type="number" min="1" max="100" value={qtyValue}
                                    onChange={e => setQtyValue(e.target.value)}
                                    className="w-16 border border-gray-300 rounded-lg px-2 py-1 text-sm text-center outline-none focus:ring-2 focus:ring-green-400" />
                                  <button onClick={() => handleSaveQty(post._id)} disabled={savingQty}
                                    className="px-2 py-1 bg-green-500 text-white text-xs rounded-lg hover:bg-green-600 disabled:opacity-50">
                                    {savingQty ? "..." : "Lưu"}
                                  </button>
                                  <button onClick={() => setEditingQty(null)}
                                    className="px-2 py-1 border border-gray-200 text-xs rounded-lg hover:bg-gray-50">
                                    ✕
                                  </button>
                                </div>
                              ) : (
                                <button onClick={() => { setEditingQty(post._id); setQtyValue(post.quantity || 1); }}
                                  className="flex items-center gap-1 mx-auto text-gray-700 hover:text-green-600 transition-colors group">
                                  <span className="font-semibold">{post.quantity || 1}</span>
                                  <span className="material-symbols-outlined text-[13px] opacity-0 group-hover:opacity-100 transition-opacity">edit</span>
                                </button>
                              )
                            ) : (
                              <span className="text-gray-300">—</span>
                            )}
                          </td>
                          <td className="px-4 py-4 text-sm text-on-surface-variant">{new Date(post.createdAt).toLocaleDateString("vi-VN")}</td>
                          <td className="px-4 py-4">
                            <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${s.color}`}>{s.label}</span>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Link to={`/dang-tin?edit=${post._id}`} className="p-1.5 text-on-surface-variant hover:text-primary transition-colors" title="Sửa">
                                <span className="material-symbols-outlined text-[18px]">edit</span>
                              </Link>
                              {post.postStatus !== "closed" && (
                                <button onClick={() => handleHide(post._id)} className="p-1.5 text-on-surface-variant hover:text-error transition-colors" title="Ẩn">
                                  <span className="material-symbols-outlined text-[18px]">visibility_off</span>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};
export default MyPosts;
