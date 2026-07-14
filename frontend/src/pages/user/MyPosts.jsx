import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  ChevronRight,
  CircleHelp,
  CirclePlus,
  EyeOff,
  Filter,
  MoreVertical,
  PackageSearch,
  Pencil,
  Search,
} from "lucide-react";
import EcoTradeLayout from "../../components/ecotrade/EcoTradeLayout";
import { useAuth } from "../../context/AuthContext";
import productService from "../../services/product.service";

const PAGE_SIZE = 5;

const STATUS = {
  pending: { label: "Đang chờ duyệt", className: "border-[#f9d9a1] bg-[#fff8eb] text-[#f2a20b]" },
  approved: { label: "Đang hiển thị", className: "border-[#bdebd0] bg-[#ecfbf2] text-[#18b963]" },
  available: { label: "Đang hiển thị", className: "border-[#bdebd0] bg-[#ecfbf2] text-[#18b963]" },
  rejected: { label: "Bị từ chối", className: "border-[#ffc7c7] bg-[#fff1f1] text-[#ef5350]" },
  sold: { label: "Đã bán", className: "border-[#d7dde5] bg-[#f3f5f7] text-[#647184]" },
  rented: { label: "Đang được thuê", className: "border-[#d7dde5] bg-[#f3f5f7] text-[#647184]" },
  inactive: { label: "Đã ẩn", className: "border-[#d7dde5] bg-[#f3f5f7] text-[#647184]" },
  closed: { label: "Đã đóng", className: "border-[#d7dde5] bg-[#f3f5f7] text-[#647184]" },
};

const SELLING_STATUSES = ["approved", "available"];
const SOLD_STATUSES = ["sold"];
const LOCKED_STATUSES = ["closed", "sold", "rented"];

const EMPTY_MESSAGE = {
  all: "Không tìm thấy bài đăng phù hợp",
  selling: "Không có sản phẩm nào đang bán",
  sold: "Chưa có sản phẩm nào đã bán",
  rejected: "Không có bài đăng bị từ chối",
};

const MyPosts = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState("all");
  const [category, setCategory] = useState("all");
  const [page, setPage] = useState(1);
  const [filterOpen, setFilterOpen] = useState(false);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const res = await productService.getMyProducts();
      if (res.success) setPosts(res.data || []);
    } catch (err) {
      console.error("Lỗi khi tải bài đăng:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPosts(); }, []);
  useEffect(() => { setPage(1); }, [query, tab, category]);

  const handleHidePost = async (postId) => {
    if (!window.confirm("Ẩn bài đăng này khỏi marketplace?")) return;
    setProcessingId(postId);
    try {
      const res = await productService.deleteProduct(postId);
      if (res.success) await fetchPosts();
    } catch (err) {
      toast.error(err.response?.data?.message || "Không thể ẩn bài đăng");
    } finally {
      setProcessingId(null);
    }
  };

  const getImageUrl = (image) => {
    if (!image) return "https://placehold.co/160x160/f0f2f4/8490a0?text=No+Image";
    return image;
  };

  const categories = useMemo(() => [...new Set(posts.map((post) => post.categoryId?.name).filter(Boolean))], [posts]);
  const rejectedCount = posts.filter((post) => post.postStatus === "rejected").length;
  const sellingCount = posts.filter((post) => SELLING_STATUSES.includes(post.postStatus)).length;
  const soldCount = posts.filter((post) => SOLD_STATUSES.includes(post.postStatus)).length;

  const filteredPosts = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("vi");
    return posts.filter((post) => {
      const matchesTab = tab === "all"
        || (tab === "selling" && SELLING_STATUSES.includes(post.postStatus))
        || (tab === "sold" && SOLD_STATUSES.includes(post.postStatus))
        || (tab === "rejected" && post.postStatus === "rejected");
      const matchesCategory = category === "all" || post.categoryId?.name === category;
      const matchesQuery = !normalized
        || post.title?.toLocaleLowerCase("vi").includes(normalized)
        || String(post._id).toLocaleLowerCase().includes(normalized);
      return matchesTab && matchesCategory && matchesQuery;
    });
  }, [posts, query, tab, category]);

  const pageCount = Math.max(1, Math.ceil(filteredPosts.length / PAGE_SIZE));
  const visiblePosts = filteredPosts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const formatPrice = (post) => {
    const price = post.productType === "rent" ? post.rentPricePerDay : post.salePrice;
    const value = new Intl.NumberFormat("vi-VN").format(price || 0);
    return `${value} ₫${post.productType === "rent" ? "/ngày" : ""}`;
  };

  return (
    <EcoTradeLayout>
      <header className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-[#5f6b7e]">
          <span>Sellers</span><ChevronRight size={15} /><span className="font-medium text-[#20242b]">Sản phẩm của tôi</span>
        </div>
        <div className="flex items-center gap-4">
          <CircleHelp size={19} strokeWidth={1.8} className="text-[#5f6b7e]" />
          <Link to="/dang-tin" className="flex h-10 items-center gap-2 rounded-lg bg-[#17c766] px-4 text-sm font-semibold text-[#07361f] transition hover:bg-[#14b95d]">
            <CirclePlus size={17} /> Đăng tin mới
          </Link>
        </div>
      </header>

      <section className="rounded-2xl border border-surface-variant/40 bg-white p-6 shadow-sm">
        <h1 className="mb-5 text-xl font-bold tracking-tight text-[#20242b]">Quản lý bài đăng</h1>

        {/* Toolbar */}
        <div className="mb-5 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <label className="flex h-10 w-full max-w-[400px] items-center gap-2 rounded-lg border border-[#d8dde5] px-3 text-[#667386] focus-within:border-[#18c768]">
            <Search size={16} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full border-0 bg-transparent text-sm outline-none placeholder:text-[#788396]"
              placeholder="Tìm kiếm theo tên sản phẩm, mã tin..."
            />
          </label>

          <div className="flex flex-wrap items-center gap-2">
            {/* Filter */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setFilterOpen((v) => !v)}
                className="flex h-10 items-center gap-2 rounded-lg border border-[#d8dde5] bg-white px-3 text-sm hover:bg-[#f7f8f9]"
              >
                <Filter size={15} /> Bộ lọc
              </button>
              {filterOpen && (
                <div className="absolute right-0 top-12 z-20 w-52 rounded-xl border border-[#dfe3e8] bg-white p-3 shadow-lg">
                  <label className="mb-2 block text-xs font-semibold text-[#687386]">Danh mục</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full rounded-lg border border-[#d8dde5] bg-white px-2 py-2 text-sm outline-none"
                  >
                    <option value="all">Tất cả danh mục</option>
                    {categories.map((item) => <option key={item} value={item}>{item}</option>)}
                  </select>
                </div>
              )}
            </div>

            {/* Tabs */}
            <div className="flex h-10 overflow-hidden rounded-lg border border-[#d8dde5] bg-white text-sm">
              {[
                ["all", `Tất cả (${posts.length})`],
                ["selling", `Đang bán (${sellingCount})`],
                ["sold", `Đã bán (${soldCount})`],
                ["rejected", `Bị từ chối (${rejectedCount})`],
              ].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setTab(value)}
                  className={`border-r border-[#d8dde5] px-3 last:border-0 text-xs ${tab === value ? "font-semibold text-[#18bd62] bg-[#f0fdf6]" : "text-[#303640] hover:bg-[#f7f8f9]"}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-xl border border-[#e2e6eb]">
          <div className="min-w-[640px]">
            {/* Header */}
            <div className="grid grid-cols-[minmax(0,2fr)_1fr_100px_120px_88px] bg-[#fafbfc] px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#667386]">
              <span>Sản phẩm</span>
              <span>Loại</span>
              <span>Giá</span>
              <span>Trạng thái</span>
              <span className="text-right">Tác vụ</span>
            </div>

            {/* Rows */}
            {loading ? (
              <div className="flex h-56 items-center justify-center text-sm text-[#778295]">Đang tải bài đăng...</div>
            ) : visiblePosts.length === 0 ? (
              <div className="flex h-56 flex-col items-center justify-center text-[#778295]">
                <PackageSearch size={32} className="mb-3 opacity-40" />
                <p className="text-sm">{EMPTY_MESSAGE[tab] || EMPTY_MESSAGE.all}</p>
              </div>
            ) : visiblePosts.map((post) => {
              const status = STATUS[post.postStatus] || STATUS.inactive;
              const canHide = SELLING_STATUSES.includes(post.postStatus);
              const canEdit = !LOCKED_STATUSES.includes(post.postStatus);
              return (
                <div key={post._id}>
                  <div className="grid min-h-[72px] grid-cols-[minmax(0,2fr)_1fr_100px_120px_88px] items-center border-t border-[#dfe3e8] px-4 py-3 transition-colors hover:bg-[#fafbfc]">
                    {/* Product */}
                    <div className="flex min-w-0 items-center gap-3 pr-3">
                      <img
                        src={getImageUrl(post.images?.[0] || post.thumbnailUrl)}
                        alt=""
                        className="h-11 w-11 shrink-0 rounded-lg border border-[#e4e7eb] object-cover"
                      />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-[#20242b]">{post.title}</p>
                        <p className="mt-0.5 text-xs text-[#778295]">#{String(post._id).slice(-7).toUpperCase()}</p>
                      </div>
                    </div>
                    {/* Type */}
                    <div>
                      <span className="rounded-full bg-[#f1f2f4] px-2.5 py-1 text-xs text-[#505b6c]">
                        {post.categoryId?.name || (post.productType === "rent" ? "Cho thuê" : "Bán")}
                      </span>
                    </div>
                    {/* Price */}
                    <p className="text-xs font-medium text-[#20242b]">{formatPrice(post)}</p>
                    {/* Status */}
                    <div>
                      <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase ${status.className}`}>
                        {status.label}
                      </span>
                    </div>
                    {/* Actions */}
                    <div className="flex items-center justify-end gap-1.5 text-[#536176]">
                      {canEdit
                        ? <Link to={`/dang-tin/${post._id}`} title="Chỉnh sửa" className="rounded-lg p-1.5 hover:bg-[#f0f2f4]"><Pencil size={15} /></Link>
                        : <span className="rounded-lg p-1.5 opacity-25"><Pencil size={15} /></span>
                      }
                      <button
                        type="button"
                        title={canHide ? "Ẩn bài đăng" : "Không thể ẩn"}
                        disabled={!canHide || processingId === post._id}
                        onClick={() => handleHidePost(post._id)}
                        className="rounded-lg p-1.5 hover:bg-[#f0f2f4] disabled:opacity-25"
                      >
                        <EyeOff size={15} />
                      </button>
                      <button type="button" title="Thêm" className="rounded-lg p-1.5 hover:bg-[#f0f2f4]">
                        <MoreVertical size={15} />
                      </button>
                    </div>
                  </div>
                  {post.postStatus === "rejected" && post.rejectReason && (
                    <div className="flex gap-3 border-t border-[#fee2e2] bg-[#fff7f7] px-5 py-2.5 text-xs text-[#ef5350]">
                      <CircleHelp size={14} className="mt-0.5 shrink-0" />
                      <div>
                        <p className="font-semibold">Lý do từ chối:</p>
                        <p className="mt-0.5 italic text-[#6b6870]">"{post.rejectReason}"</p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Pagination */}
        <footer className="mt-4 flex flex-col items-center justify-between gap-4 text-sm text-[#687386] sm:flex-row">
          <p>Hiển thị {visiblePosts.length} trên {filteredPosts.length} sản phẩm</p>
          <div className="flex items-center gap-1 text-[#20242b]">
            <button type="button" disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="mr-1 rounded-lg border border-[#dfe3e8] px-3 py-1.5 text-[#687386] disabled:opacity-40">Trước</button>
            {Array.from({ length: pageCount }, (_, index) => index + 1).slice(0, 5).map((number) => (
              <button key={number} type="button" onClick={() => setPage(number)} className={`h-8 w-8 rounded-lg ${page === number ? "bg-[#18c768] font-semibold text-[#07361f]" : "hover:bg-[#f1f3f5]"}`}>{number}</button>
            ))}
            <button type="button" disabled={page === pageCount} onClick={() => setPage((p) => p + 1)} className="ml-1 rounded-lg border border-[#dfe3e8] px-3 py-1.5 text-[#687386] disabled:opacity-40">Sau</button>
          </div>
        </footer>
      </section>
    </EcoTradeLayout>
  );
};

export default MyPosts;
