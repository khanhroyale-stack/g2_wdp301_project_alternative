import { useEffect, useMemo, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  Box,
  ChevronRight,
  CircleHelp,
  CirclePlus,
  EyeOff,
  Filter,
  LayoutGrid,
  LogOut,
  MoreVertical,
  PackageSearch,
  Pencil,
  Search,
  Settings,
  ShoppingCart,
} from "lucide-react";
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

function SellerSidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const displayName = user?.fullName || user?.name || "Người bán";
  const navItems = [
    { label: "Tổng quan", icon: LayoutGrid, to: "/ho-so" },
    { label: "Sản phẩm của tôi", icon: ShoppingCart, to: "/quan-ly/bai-dang" },
    { label: "Đơn hàng", icon: Box, to: "/don-ban" },
    { label: "Cài đặt cửa hàng", icon: Settings, to: "/ho-so" },
  ];

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[256px] flex-col border-r border-[#dfe3e8] bg-[#fbfbfc] lg:flex">
      <Link to="/marketplaces" className="flex h-[88px] items-center gap-2 border-b border-[#e4e7eb] px-11 text-[20px] font-bold text-[#16c768]">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#16c768] text-white">
          <PackageSearch size={21} strokeWidth={2.2} />
        </span>
        SellerCenter
      </Link>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map(({ label, icon: Icon, to }, index) => (
          <NavLink
            key={`${label}-${index}`}
            to={to}
            end={label !== "Sản phẩm của tôi"}
            className={({ isActive }) => {
              const active = label === "Sản phẩm của tôi" || isActive;
              return `flex h-11 items-center gap-3 rounded-lg px-4 text-sm transition-colors ${
                active && label === "Sản phẩm của tôi"
                  ? "bg-[#1ac96b] font-medium text-[#092f1d]"
                  : "text-[#596579] hover:bg-[#f0f2f4]"
              }`;
            }}
          >
            <Icon size={20} strokeWidth={1.8} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-[#dfe3e8] p-4">
        <div className="flex items-center gap-3 rounded-xl border border-[#dfe3e8] bg-white p-2">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#e7ecf0] text-sm font-bold text-[#425064]">
            {user?.avatarUrl ? <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" /> : displayName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-[#20242b]">{displayName}</p>
            <p className="text-[11px] text-[#707b8d]">Cấp độ: {user?.reputationScore >= 90 ? "Diamond" : "Seller"}</p>
          </div>
          <button
            type="button"
            title="Đăng xuất"
            onClick={() => { logout(); navigate("/marketplaces"); }}
            className="rounded-md p-1.5 text-[#647184] hover:bg-[#f2f4f6]"
          >
            <LogOut size={17} />
          </button>
        </div>
      </div>
    </aside>
  );
}

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
      alert(err.response?.data?.message || "Không thể ẩn bài đăng");
    } finally {
      setProcessingId(null);
    }
  };

  const getImageUrl = (image) => {
    if (!image) return "https://placehold.co/160x160/f0f2f4/8490a0?text=No+Image";
    if (image.startsWith("http")) return image;
    return `http://localhost:5000${image}`;
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
    <div className="min-h-screen bg-white font-sans text-[#20242b]">
      <SellerSidebar />
      <div className="lg:ml-[256px]">
        <header className="flex h-[72px] items-center justify-between border-b border-[#e3e6ea] px-5 md:px-8">
          <div className="flex items-center gap-2 text-sm text-[#5f6b7e]">
            <span>Sellers</span><ChevronRight size={15} /><span className="font-medium text-[#20242b]">Sản phẩm của tôi</span>
          </div>
          <div className="flex items-center gap-7">
            <CircleHelp size={19} strokeWidth={1.8} />
            <Link to="/dang-tin" className="flex h-10 items-center gap-2 rounded-md bg-[#17c766] px-4 text-sm font-semibold text-[#07361f] transition hover:bg-[#14b95d]">
              <CirclePlus size={17} /> Đăng tin mới
            </Link>
          </div>
        </header>

        <main className="px-5 pb-8 pt-7 md:px-8">
          <h1 className="mb-5 text-[24px] font-bold tracking-[-0.03em]">Quản lý bài đăng</h1>

          <div className="mb-5 flex flex-col justify-between gap-3 xl:flex-row xl:items-center">
            <label className="flex h-10 w-full max-w-[448px] items-center gap-2 rounded-md border border-[#d8dde5] px-3 text-[#667386] focus-within:border-[#18c768]">
              <Search size={17} />
              <input value={query} onChange={(e) => setQuery(e.target.value)} className="w-full border-0 bg-transparent text-sm outline-none placeholder:text-[#788396]" placeholder="Tìm kiếm theo tên sản phẩm, mã tin..." />
            </label>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <button type="button" onClick={() => setFilterOpen((value) => !value)} className="flex h-10 items-center gap-2 rounded-md border border-[#d8dde5] bg-white px-4 text-sm hover:bg-[#f7f8f9]">
                  <Filter size={17} /> Bộ lọc
                </button>
                {filterOpen && (
                  <div className="absolute right-0 top-12 z-20 w-56 rounded-lg border border-[#dfe3e8] bg-white p-3 shadow-lg">
                    <label className="mb-2 block text-xs font-semibold text-[#687386]">Danh mục</label>
                    <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full rounded-md border border-[#d8dde5] bg-white px-2 py-2 text-sm outline-none">
                      <option value="all">Tất cả danh mục</option>
                      {categories.map((item) => <option key={item} value={item}>{item}</option>)}
                    </select>
                  </div>
                )}
              </div>

              <div className="flex h-10 overflow-hidden rounded-md border border-[#d8dde5] bg-white text-sm">
                {[
                  ["all", `Tất cả (${posts.length})`],
                  ["selling", `Đang bán (${sellingCount})`],
                  ["sold", `Đã bán (${soldCount})`],
                  ["rejected", `Bị từ chối (${rejectedCount})`],
                ].map(([value, label]) => (
                  <button key={value} type="button" onClick={() => setTab(value)} className={`border-r border-[#d8dde5] px-4 last:border-0 ${tab === value ? "font-semibold text-[#18bd62]" : "text-[#303640] hover:bg-[#f7f8f9]"}`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="min-h-[555px] overflow-x-auto">
            <div className="min-w-[920px]">
              <div className="grid grid-cols-[2.6fr_1.25fr_1fr_1.35fr_110px] rounded-t-xl bg-[#fafbfc] px-4 py-3 text-sm font-medium text-[#667386]">
                <span>Sản phẩm</span><span>Loại bài đăng</span><span>Giá niêm yết</span><span>Trạng thái</span><span className="text-right">Hành động</span>
              </div>

              {loading ? (
                <div className="flex h-64 items-center justify-center border-b border-[#e2e6eb] text-sm text-[#778295]">Đang tải bài đăng...</div>
              ) : visiblePosts.length === 0 ? (
                <div className="flex h-64 flex-col items-center justify-center border-b border-[#e2e6eb] text-[#778295]">
                  <PackageSearch size={34} className="mb-3" /><p className="text-sm">{EMPTY_MESSAGE[tab] || EMPTY_MESSAGE.all}</p>
                </div>
              ) : visiblePosts.map((post) => {
                const status = STATUS[post.postStatus] || STATUS.inactive;
                const canHide = SELLING_STATUSES.includes(post.postStatus);
                const canEdit = !LOCKED_STATUSES.includes(post.postStatus);
                return (
                  <div key={post._id}>
                    <div className="grid min-h-[96px] grid-cols-[2.6fr_1.25fr_1fr_1.35fr_110px] items-center border-b border-[#dfe3e8] px-4 py-3">
                      <div className="flex min-w-0 items-center gap-4 pr-5">
                        <img src={getImageUrl(post.images?.[0] || post.thumbnailUrl)} alt="" className="h-16 w-16 shrink-0 rounded-md border border-[#e4e7eb] object-cover" />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-[#20242b]">{post.title}</p>
                          <p className="mt-1 text-xs text-[#778295]">ID: #{String(post._id).slice(-7).toUpperCase()}</p>
                        </div>
                      </div>
                      <div><span className="rounded-full bg-[#f1f2f4] px-3 py-1.5 text-xs text-[#505b6c]">{post.categoryId?.name || (post.productType === "rent" ? "Cho thuê" : "Sản phẩm")}</span></div>
                      <p className="text-sm font-medium">{formatPrice(post)}</p>
                      <div>
                        <span className={`inline-flex rounded-full border px-3 py-1.5 text-[10px] font-bold uppercase ${status.className}`}>{status.label}</span>
                        {post.postStatus === "rejected" && <p className="mt-2 flex items-center gap-1 text-xs text-[#ef5350]"><CircleHelp size={12} /> Xem lý do</p>}
                      </div>
                      <div className="flex items-center justify-end gap-3 text-[#536176]">
                        {canEdit ? <Link to={`/dang-tin/${post._id}`} title="Chỉnh sửa" className="rounded p-1 hover:bg-[#f0f2f4]"><Pencil size={17} /></Link> : <span className="rounded p-1 opacity-40"><Pencil size={17} /></span>}
                        <button type="button" title={canHide ? "Ẩn bài đăng" : "Bài đăng không thể ẩn"} disabled={!canHide || processingId === post._id} onClick={() => handleHidePost(post._id)} className="rounded p-1 hover:bg-[#f0f2f4] disabled:opacity-50"><EyeOff size={18} /></button>
                        <button type="button" title="Thêm" className="rounded p-1 hover:bg-[#f0f2f4]"><MoreVertical size={18} /></button>
                      </div>
                    </div>
                    {post.postStatus === "rejected" && post.rejectReason && (
                      <div className="flex gap-3 border-b border-[#fee2e2] bg-[#fff7f7] px-6 py-3 text-xs text-[#ef5350]">
                        <CircleHelp size={16} className="mt-0.5 shrink-0" />
                        <div><p className="font-semibold">Lý do từ chối bài đăng:</p><p className="mt-1 italic text-[#6b6870]">“{post.rejectReason}”</p></div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <footer className="mt-4 flex flex-col items-center justify-between gap-4 text-sm text-[#687386] sm:flex-row">
            <p>Hiển thị {visiblePosts.length} trên {filteredPosts.length} sản phẩm</p>
            <div className="flex items-center gap-1 text-[#20242b]">
              <button type="button" disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="mr-1 rounded-md border border-[#dfe3e8] px-3 py-2 text-[#687386] disabled:opacity-40">Trước</button>
              {Array.from({ length: pageCount }, (_, index) => index + 1).slice(0, 5).map((number) => (
                <button key={number} type="button" onClick={() => setPage(number)} className={`h-9 w-9 rounded-md ${page === number ? "bg-[#18c768] font-semibold text-[#07361f]" : "hover:bg-[#f1f3f5]"}`}>{number}</button>
              ))}
              <button type="button" disabled={page === pageCount} onClick={() => setPage((p) => p + 1)} className="ml-1 rounded-md border border-[#dfe3e8] px-3 py-2 text-[#687386] disabled:opacity-40">Sau</button>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
};

export default MyPosts;
