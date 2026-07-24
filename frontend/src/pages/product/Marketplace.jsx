import { useState, useCallback, useEffect } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import { useAuth } from "../../context/AuthContext";
import productService from "../../services/product.service";
import categoryService from "../../services/category.service";
import chatService from "../../services/chat.service";
import cartService from "../../services/cart.service";
import useRealtimeRefresh from "../../hooks/useRealtimeRefresh";

const CONDITION_OPTIONS = [
  { value: "", label: "Tất cả" },
  { value: "new", label: "Mới 100%" },
  { value: "good", label: "Đã sử dụng" },
];

const mapStatusToCondition = (status) => {
  switch (status) {
    case "new": return "Mới 100%";
    case "good": return "Đã sử dụng";
    default: return "";
  }
};

const Marketplace = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const isRentPage = location.pathname === "/cho-thue";

  const [categories, setCategories] = useState([]);
  const [selectedCat, setSelectedCat] = useState("Tất cả");
  const [selectedCond, setSelectedCond] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  const [products, setProducts] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const keyword = searchParams.get("q") || "";

  useEffect(() => {
    categoryService.getCategories().then(res => {
      if (res.success) setCategories(res.data);
    }).catch(err => console.error(err));
  }, []);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        productType: isRentPage ? "rent" : "sale",
        sort: sortBy,
        page: currentPage,
        limit: 12
      };
      if (keyword) params.keyword = keyword;
      if (selectedCat !== "Tất cả") params.category = selectedCat;
      if (selectedCond) params.condition = selectedCond;
      if (minPrice) params.minPrice = minPrice;
      if (maxPrice) params.maxPrice = maxPrice;

      const res = await productService.getProducts(params);
      if (res.success) {
        if (Array.isArray(res.data)) {
          setFeaturedProducts([]);
          setProducts(res.data);
        } else {
          setFeaturedProducts(res.data?.featuredProducts || []);
          setProducts(res.data?.products || []);
        }
        if (res.pagination) {
          setTotalPages(res.pagination.pages || 1);
        } else {
          setTotalPages(1);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [isRentPage, keyword, selectedCat, selectedCond, sortBy, minPrice, maxPrice, currentPage]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);
  useRealtimeRefresh("product", fetchProducts);

  const formatPrice = (num) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);

  const handleRentNow = (event, productId) => {
    event.stopPropagation();
    navigate(user ? `/thue/${productId}` : "/dang-nhap");
  };

  const handleBuyNow = (event, product) => {
    event.stopPropagation();
    if (!["sale", "both"].includes(product.productType) || (Number(product.quantity) || 0) < 1) {
      toast.error("Sản phẩm hiện không sẵn sàng để mua.");
      return;
    }
    navigate(user ? `/dat-hang/${product._id}?quantity=1` : "/dang-nhap");
  };

  const handleAddToCart = async (event, product) => {
    event.stopPropagation();
    if (!user) {
      navigate("/dang-nhap");
      return;
    }

    const ownerId = product.ownerId?._id || product.ownerId;
    if (ownerId && String(ownerId) === String(user.id || user._id)) {
      toast.error("Không thể thêm sản phẩm của chính bạn vào giỏ hàng.");
      return;
    }

    if (!["sale", "both"].includes(product.productType) || (Number(product.quantity) || 0) < 1) {
      toast.error("Sản phẩm hiện không sẵn sàng để mua.");
      return;
    }

    try {
      const res = await cartService.addCartItem(product._id, 1);
      if (res.success) toast.success("Đã thêm sản phẩm vào giỏ hàng.");
    } catch (error) {
      toast.error(error.response?.data?.message || "Không thể thêm vào giỏ hàng.");
    }
  };

  const handleContact = async (event, product) => {
    event.stopPropagation();
    if (!user) {
      navigate("/dang-nhap");
      return;
    }

    const ownerId = product.ownerId?._id || product.ownerId;
    if (!ownerId || String(ownerId) === String(user.id || user._id)) {
      toast.error("Không thể liên hệ với chính bài đăng của bạn.");
      return;
    }

    try {
      const res = await chatService.getOrCreateRoom(ownerId, product._id);
      if (res.success) navigate(`/tin-nhan/${res.data.room._id}`);
    } catch (error) {
      toast.error(error.response?.data?.message || "Không thể mở cuộc trò chuyện.");
    }
  };

  const resetFilters = () => {
    setSelectedCat("Tất cả");
    setSelectedCond("");
    setMinPrice("");
    setMaxPrice("");
    setCurrentPage(1);
  };

  const filterBtnClass = (active) =>
    `w-full text-left px-4 py-3 rounded-field text-sm font-semibold transition-all duration-200 ${
      active
        ? "bg-primary text-white shadow-card"
        : "text-muted-foreground hover:bg-surface-secondary hover:text-primary"
    }`;

  const renderActionButtons = (product) => (
    <>
      {["rent", "both"].includes(product.productType) && (
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={(event) => handleRentNow(event, product._id)}
            className="h-10 rounded-btn bg-secondary px-3 text-xs font-bold text-white transition-all duration-200 hover:bg-secondary/90 active:scale-[0.98]"
          >
            Thuê ngay
          </button>
          <button
            type="button"
            onClick={(event) => handleContact(event, product)}
            className="h-10 rounded-btn border border-border bg-surface px-3 text-xs font-bold text-primary transition-all duration-200 hover:bg-surface-secondary hover:border-primary/30 active:scale-[0.98]"
          >
            Liên hệ
          </button>
        </div>
      )}
      {["sale", "both"].includes(product.productType) && (
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={(event) => handleBuyNow(event, product)}
            className="h-10 rounded-btn bg-primary px-3 text-xs font-bold text-white transition-all duration-200 hover:bg-primary-hover active:scale-[0.98]"
          >
            Mua ngay
          </button>
          <button
            type="button"
            onClick={(event) => handleAddToCart(event, product)}
            className="h-10 rounded-btn border border-border bg-surface px-3 text-xs font-bold text-primary transition-all duration-200 hover:bg-surface-secondary hover:border-primary/30 active:scale-[0.98]"
          >
            Thêm vào giỏ
          </button>
        </div>
      )}
    </>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      <Navbar />

      <main className="flex-grow pt-24 pb-16 px-4 md:px-10 max-w-7xl mx-auto w-full flex flex-col md:flex-row gap-8 lg:gap-12">
        {/* Sidebar filter */}
        <aside className="w-full md:w-64 lg:w-72 flex-shrink-0">
          <div className="sticky top-24 flex flex-col gap-8 rounded-card border border-border bg-surface p-6 shadow-card">
            <div>
              <h3 className="text-[11px] font-bold text-muted uppercase tracking-[0.16em] mb-4">
                Bộ lọc danh mục
              </h3>
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => { setSelectedCat("Tất cả"); setCurrentPage(1); }}
                  className={filterBtnClass(selectedCat === "Tất cả")}
                >
                  Tất cả sản phẩm
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat._id}
                    onClick={() => { setSelectedCat(cat._id); setCurrentPage(1); }}
                    className={filterBtnClass(selectedCat === cat._id)}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-field bg-surface-secondary p-4">
              <h3 className="text-[11px] font-bold text-primary uppercase tracking-[0.16em] mb-3">
                Khoảng giá
              </h3>
              <div className="flex flex-col gap-3">
                <div className="relative">
                  <input
                    className="et-input pr-8"
                    placeholder="Từ"
                    type="number"
                    value={minPrice}
                    onChange={(e) => { setMinPrice(e.target.value); setCurrentPage(1); }}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-muted">₫</span>
                </div>
                <div className="relative">
                  <input
                    className="et-input pr-8"
                    placeholder="Đến"
                    type="number"
                    value={maxPrice}
                    onChange={(e) => { setMaxPrice(e.target.value); setCurrentPage(1); }}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-muted">₫</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-[11px] font-bold text-muted uppercase tracking-[0.16em] mb-4">
                Tình trạng đồ
              </h3>
              <div className="flex flex-wrap gap-2">
                {CONDITION_OPTIONS.map((condition) => (
                  <button
                    key={condition.value || "all"}
                    onClick={() => { setSelectedCond(condition.value); setCurrentPage(1); }}
                    className={`px-3.5 py-2 rounded-pill text-xs font-semibold transition-all duration-200 border ${
                      selectedCond === condition.value
                        ? "bg-primary border-primary text-white"
                        : "border-border text-muted-foreground hover:border-primary/40 hover:text-primary bg-surface"
                    }`}
                  >
                    {condition.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={resetFilters}
              className="inline-flex items-center gap-2 text-xs font-bold text-danger/70 hover:text-danger transition-colors duration-200 pt-4 border-t border-border"
            >
              <span className="material-symbols-outlined text-[16px]">refresh</span>
              Đặt lại bộ lọc
            </button>
          </div>
        </aside>

        {/* Danh sách sản phẩm */}
        <section className="flex-grow min-w-0">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-5">
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-foreground tracking-tight">
                {keyword ? `Kết quả: "${keyword}"` : (isRentPage ? "Thuê đồ dùng" : "Mua sắm")}
              </h1>
              <p className="text-muted-foreground font-medium mt-2">
                Tìm thấy {featuredProducts.length + products.length} món đồ chất lượng
              </p>
            </div>
            <div className="flex items-center gap-3 bg-surface px-4 py-2.5 rounded-field shadow-card border border-border">
              <span className="text-[11px] font-bold text-muted uppercase tracking-wider">Sắp xếp:</span>
              <select
                value={sortBy}
                onChange={(e) => { setSortBy(e.target.value); setCurrentPage(1); }}
                className="bg-transparent text-sm font-bold text-primary outline-none cursor-pointer"
              >
                <option value="newest">Mới nhất</option>
                <option value="price_asc">Giá rẻ nhất</option>
                <option value="price_desc">Giá cao nhất</option>
              </select>
            </div>
          </div>

          {!loading && featuredProducts.length > 0 && (
            <div className="mb-12">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-foreground">Sản phẩm nổi bật</h2>
                <div className="h-1 w-12 bg-primary rounded-pill mt-2" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                {featuredProducts.map((product) => {
                  const displayPrice = product.productType === "rent"
                    ? `${formatPrice(product.rentPricePerDay)}/ngày`
                    : formatPrice(product.salePrice);

                  return (
                    <article
                      key={product._id}
                      onClick={() => navigate(`/marketplaces/${product._id}`)}
                      className="cursor-pointer group et-card et-card-hover flex flex-col overflow-hidden"
                    >
                      <div className="relative aspect-[4/3] overflow-hidden bg-surface-secondary m-3 mb-0 rounded-image">
                        <img
                          alt={product.title}
                          src={product.thumbnailUrl || "https://placehold.co/600x600?text=EcoTrade"}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute top-3 left-3">
                          <span className="et-badge bg-warning text-white shadow-sm">Nổi bật</span>
                        </div>
                      </div>
                      <div className="p-5 flex flex-col flex-grow">
                        <h3 className="line-clamp-2 font-bold text-base text-foreground mb-3 group-hover:text-primary transition-colors duration-200">
                          {product.title}
                        </h3>
                        <div className="mt-auto flex justify-between items-end border-t border-border pt-4">
                          <p className="text-xl font-extrabold text-primary">{displayPrice}</p>
                          <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px]">location_on</span>
                            {product.location?.split(',')[0] || "Hòa Lạc"}
                          </span>
                        </div>
                        {renderActionButtons(product)}
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="animate-pulse bg-surface rounded-card border border-border overflow-hidden">
                  <div className="aspect-[4/3] m-3 rounded-image bg-surface-secondary" />
                  <div className="p-5 space-y-3">
                    <div className="h-4 bg-surface-secondary rounded-btn w-4/5" />
                    <div className="h-4 bg-surface-secondary rounded-btn w-2/5" />
                    <div className="h-10 bg-surface-secondary rounded-btn w-full mt-4" />
                  </div>
                </div>
              ))}
            </div>
          ) : products.length === 0 && featuredProducts.length === 0 ? (
            <div className="text-center py-24 bg-surface rounded-card border border-border shadow-card">
              <span className="material-symbols-outlined text-6xl text-primary/20 block mb-4">search_off</span>
              <p className="text-muted-foreground font-medium">Không tìm thấy sản phẩm phù hợp.</p>
              <button
                onClick={resetFilters}
                className="mt-5 text-primary font-bold hover:underline"
              >
                Xóa tất cả bộ lọc
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {products.map((product) => {
                const conditionLabel = mapStatusToCondition(product.conditionStatus);
                const conditionColor = product.conditionStatus === "new" || product.conditionStatus === "like_new"
                  ? "bg-primary text-white"
                  : "bg-surface-secondary text-muted-foreground";

                const displayPrice = product.productType === "rent"
                  ? `${formatPrice(product.rentPricePerDay)}/ngày`
                  : formatPrice(product.salePrice);

                return (
                  <article
                    key={product._id}
                    onClick={() => navigate(`/marketplaces/${product._id}`)}
                    className="group et-card et-card-hover flex flex-col overflow-hidden cursor-pointer"
                  >
                    <div className="relative aspect-[4/3] bg-surface-secondary overflow-hidden m-3 mb-0 rounded-image">
                      <img
                        alt={product.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        src={product.thumbnailUrl || "https://placehold.co/600x600?text=EcoTrade"}
                      />
                      <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                        {conditionLabel ? (
                          <span className={`et-badge shadow-sm ${conditionColor}`}>
                            {conditionLabel}
                          </span>
                        ) : null}
                        {["rent", "both"].includes(product.productType) && (
                          <span className="et-badge bg-secondary text-white shadow-sm">Thuê</span>
                        )}
                      </div>
                    </div>
                    <div className="p-5 flex flex-col flex-grow">
                      <h2 className="font-bold text-foreground text-base leading-snug line-clamp-2 group-hover:text-primary transition-colors duration-200 mb-2">
                        {product.title}
                      </h2>
                      <p className="text-lg font-extrabold text-primary mb-4">{displayPrice}</p>

                      <div className="mt-auto pt-4 border-t border-border flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          {product.ownerId?.avatarUrl ? (
                            <img src={product.ownerId.avatarUrl} alt="" className="w-6 h-6 rounded-full object-cover shrink-0" />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-surface-secondary flex items-center justify-center shrink-0">
                              <span className="material-symbols-outlined text-[12px] text-primary">person</span>
                            </div>
                          )}
                          <span className="text-[12px] font-semibold text-muted-foreground truncate">
                            {product.ownerId?.fullName || "EcoTrader"}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground shrink-0">
                          <span className="material-symbols-outlined text-[14px]">location_on</span>
                          <span className="text-[12px] font-medium truncate max-w-[80px]">
                            {product.location?.split(',')[0] || "Hòa Lạc"}
                          </span>
                        </div>
                      </div>
                      {renderActionButtons(product)}
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {/* Phân trang */}
          {!loading && totalPages > 1 && (
            <div className="flex justify-center items-center mt-12 gap-2">
              <button
                onClick={() => {
                  setCurrentPage(p => Math.max(1, p - 1));
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                disabled={currentPage === 1}
                className="w-10 h-10 flex items-center justify-center rounded-btn border border-border text-muted-foreground hover:border-primary hover:text-primary transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed bg-surface"
              >
                <span className="material-symbols-outlined text-[18px]">chevron_left</span>
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => {
                    setCurrentPage(page);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className={`w-10 h-10 flex items-center justify-center rounded-btn text-sm font-bold transition-all duration-200 ${
                    currentPage === page
                      ? "bg-primary text-white shadow-card"
                      : "border border-border text-muted-foreground hover:border-primary hover:text-primary bg-surface"
                  }`}
                >
                  {page}
                </button>
              ))}

              <button
                onClick={() => {
                  setCurrentPage(p => Math.min(totalPages, p + 1));
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                disabled={currentPage === totalPages}
                className="w-10 h-10 flex items-center justify-center rounded-btn border border-border text-muted-foreground hover:border-primary hover:text-primary transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed bg-surface"
              >
                <span className="material-symbols-outlined text-[18px]">chevron_right</span>
              </button>
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Marketplace;
