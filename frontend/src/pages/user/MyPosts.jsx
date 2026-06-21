import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import productService from "../../services/product.service";

const STATUS = {
  pending: { label: "Cho duyet", color: "bg-surface-container text-on-surface-variant" },
  approved: { label: "Dang hien thi", color: "bg-secondary-container text-on-secondary-container" },
  available: { label: "Dang mo ban", color: "bg-secondary-container text-on-secondary-container" },
  rejected: { label: "Bi tu choi", color: "bg-error-container text-on-error-container" },
  sold: { label: "Da ban", color: "bg-surface-container-high text-on-surface" },
  rented: { label: "Dang duoc thue", color: "bg-surface-container-high text-on-surface" },
  inactive: { label: "Da an", color: "bg-surface-container-high text-on-surface" },
  closed: { label: "Da dong", color: "bg-surface-container-high text-on-surface" },
};

const MyPosts = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const res = await productService.getMyProducts();
      if (res.success) {
        setPosts(res.data);
      }
    } catch (err) {
      console.error("Loi khi tai bai dang:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleHidePost = async (postId) => {
    const confirmed = window.confirm("An bai dang nay khoi marketplace?");
    if (!confirmed) {
      return;
    }

    setProcessingId(postId);
    try {
      const res = await productService.deleteProduct(postId);
      if (res.success) {
        await fetchPosts();
      }
    } catch (err) {
      alert(err.response?.data?.message || "Khong the an bai dang");
    } finally {
      setProcessingId(null);
    }
  };

  const getImageUrl = (img) => {
    if (!img) return "https://via.placeholder.com/120?text=No+Image";
    if (img.startsWith("http")) return img;
    return `http://localhost:5000${img}`;
  };

  const formatPrice = (num) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(num || 0);

  return (
    <div className="flex min-h-screen bg-[#F5F5F7]">
      <Sidebar variant="user" />
      <main className="flex-1 md:ml-72 px-4 md:px-10 py-10">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-on-surface">Bai dang cua toi</h1>
              <p className="text-on-surface-variant text-sm mt-1">{posts.length} bai dang</p>
            </div>
            <Link
              to="/dang-tin"
              className="flex items-center gap-1.5 px-5 py-2.5 bg-primary text-on-primary rounded-full text-sm font-semibold hover:opacity-90 transition-all shadow-sm"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              Dang tin moi
            </Link>
          </div>

          <div className="bg-surface-container-lowest rounded-2xl shadow-apple border border-surface-variant/30 overflow-hidden">
            {loading ? (
              <div className="p-10 text-center text-on-surface-variant">Dang tai...</div>
            ) : posts.length === 0 ? (
              <div className="p-10 text-center text-on-surface-variant">
                Ban chua co bai dang nao.{" "}
                <Link to="/dang-tin" className="text-primary hover:underline">
                  Dang tin ngay
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-surface-bright/70 border-b border-surface-variant/50">
                    <tr>
                      {["San pham", "Danh muc", "Loai", "Gia", "Ngay dang", "Trang thai", ""].map((header) => (
                        <th
                          key={header}
                          className="px-4 py-3.5 text-xs font-bold text-on-surface-variant uppercase tracking-wider"
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-variant/30">
                    {posts.map((post) => {
                      const statusInfo = STATUS[post.postStatus] || {
                        label: post.postStatus,
                        color: "bg-surface-variant text-on-surface",
                      };
                      const typeLabel = post.productType === "rent" ? "Cho thue" : "Ban";
                      const displayPrice =
                        post.productType === "rent"
                          ? `${formatPrice(post.rentPricePerDay)}/ngay`
                          : formatPrice(post.salePrice);
                      const canEdit = post.postStatus !== "closed";
                      const canHide = ["approved", "available"].includes(post.postStatus);

                      return (
                        <tr key={post._id} className="hover:bg-surface-bright/40 transition-colors group">
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-lg overflow-hidden bg-surface-container-low flex-shrink-0">
                                <img src={getImageUrl(post.thumbnailUrl)} alt="" className="w-full h-full object-cover" />
                              </div>
                              <div className="max-w-[220px]">
                                <div className="font-semibold text-on-surface text-sm line-clamp-2">{post.title}</div>
                                {post.rejectReason ? (
                                  <div className="mt-1 text-xs text-error line-clamp-2">{post.rejectReason}</div>
                                ) : null}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-sm text-on-surface-variant">{post.categoryId?.name || "N/A"}</td>
                          <td className="px-4 py-4">
                            <span className="text-xs px-2.5 py-1 rounded-full bg-surface-container text-on-surface-variant">
                              {typeLabel}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-sm font-semibold text-primary">{displayPrice}</td>
                          <td className="px-4 py-4 text-sm text-on-surface-variant">
                            {new Date(post.createdAt).toLocaleDateString("vi-VN")}
                          </td>
                          <td className="px-4 py-4">
                            <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${statusInfo.color}`}>
                              {statusInfo.label}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
                              {canEdit ? (
                                <Link
                                  to={`/dang-tin/${post._id}`}
                                  className="p-1.5 text-on-surface-variant hover:text-primary transition-colors"
                                  title="Sua"
                                >
                                  <span className="material-symbols-outlined text-[18px]">edit</span>
                                </Link>
                              ) : null}
                              {canHide ? (
                                <button
                                  className="p-1.5 text-on-surface-variant hover:text-error transition-colors disabled:opacity-50"
                                  title="An"
                                  disabled={processingId === post._id}
                                  onClick={() => handleHidePost(post._id)}
                                >
                                  <span className="material-symbols-outlined text-[18px]">
                                    {processingId === post._id ? "progress_activity" : "visibility_off"}
                                  </span>
                                </button>
                              ) : null}
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
