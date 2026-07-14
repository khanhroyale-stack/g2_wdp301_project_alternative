import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import productService from "../../services/product.service";
import categoryService from "../../services/category.service";
import ProBadge from "../../components/ui/ProBadge";

const CONDITIONS = ["Tất cả", "Mới", "Như mới", "Đã dùng - Còn tốt", "Đã dùng - Có lỗi nhỏ"];

const mapConditionToStatus = (cond) => {
  switch (cond) {
    case "Mới": return "new";
    case "Như mới": return "like_new";
    case "Đã dùng - Còn tốt": return "good";
    case "Đã dùng - Có lỗi nhỏ": return "fair";
    default: return "";
  }
};

const mapStatusToCondition = (status) => {
  switch (status) {
    case "new": return "Mới";
    case "like_new": return "Như mới";
    case "good": return "Đã dùng - Còn tốt";
    case "fair": return "Đã dùng - Có lỗi nhỏ";
    default: return "";
  }
};

const Marketplace = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isRentPage = location.pathname === "/cho-thue";

  const [categories, setCategories] = useState([]);
  const [selectedCat, setSelectedCat] = useState("Tất cả");
  const [selectedCond, setSelectedCond] = useState("Tất cả");
  const [sortBy, setSortBy] = useState("newest");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  const [products, setProducts] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const keyword = searchParams.get("q") || "";

  useEffect(() => {
    categoryService.getCategories().then(res => {
      if (res.success) setCategories(res.data);
    }).catch(err => console.error(err));
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const params = {
          productType: isRentPage ? "rent" : "sale",
          sort: sortBy
        };
        if (keyword) params.keyword = keyword;
        if (selectedCat !== "Tất cả") params.category = selectedCat;
        if (selectedCond !== "Tất cả") params.condition = mapConditionToStatus(selectedCond);
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
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [isRentPage, keyword, selectedCat, selectedCond, sortBy, minPrice, maxPrice]);

  const inputCls = "w-full bg-surface-bright border border-surface-variant rounded-lg px-3 py-2 text-sm text-on-surface focus:border-primary outline-none transition-all";

  // Helper to get image URL — thumbnailUrl từ Cloudinary/upload đã là full URL
  const getImageUrl = (url) => {
    if (!url) return null; // Dùng null để hiển thị placeholder đẹp
    return url;
  };

  const formatPrice = (num) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      <Navbar />

      <main className="flex-grow pt-24 pb-16 px-4 md:px-10 max-w-7xl mx-auto w-full flex flex-col md:flex-row gap-12">
        {/* Sidebar filter */}
        <aside className="w-full md:w-64 flex-shrink-0">
          <div className="sticky top-24 flex flex-col gap-10">
            <div>
              <h3 className="text-[10px] font-black text-on-surface-variant/60 uppercase tracking-[0.2em] mb-6">Bộ lọc danh mục</h3>
              <div className="flex flex-col gap-2">
                <button onClick={() => setSelectedCat("Tất cả")}
                  className={`w-full text-left px-5 py-3 rounded-pill text-sm font-bold transition-all ${selectedCat === "Tất cả" ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-on-surface-variant hover:bg-primary/5 hover:text-primary"}`}>
                  Tất cả sản phẩm
                </button>
                {categories.map((cat) => (
                  <button key={cat._id} onClick={() => setSelectedCat(cat._id)}
                    className={`w-full text-left px-5 py-3 rounded-pill text-sm font-bold transition-all ${selectedCat === cat._id ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-on-surface-variant hover:bg-primary/5 hover:text-primary"}`}>
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-primary/5 rounded-organic p-6">
              <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-4">Khoảng giá</h3>
              <div className="flex flex-col gap-3">
                <div className="relative">
                  <input className="w-full bg-white border border-primary/10 rounded-xl px-4 py-3 text-sm focus:border-primary outline-none transition-all pr-8" placeholder="Từ" type="number" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-primary/40">₫</span>
                </div>
                <div className="relative">
                  <input className="w-full bg-white border border-primary/10 rounded-xl px-4 py-3 text-sm focus:border-primary outline-none transition-all pr-8" placeholder="Đến" type="number" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-primary/40">₫</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-[10px] font-black text-on-surface-variant/60 uppercase tracking-[0.2em] mb-6">Tình trạng đồ</h3>
              <div className="flex flex-wrap gap-2">
                {CONDITIONS.map((cond) => (
                  <button key={cond} onClick={() => setSelectedCond(cond)}
                    className={`px-4 py-2 rounded-full text-xs font-bold transition-all border ${selectedCond === cond ? "bg-secondary border-secondary text-white" : "border-primary/10 text-on-surface-variant hover:border-primary/30 hover:text-primary"}`}>
                    {cond}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => { setSelectedCat("Tất cả"); setSelectedCond("Tất cả"); setMinPrice(""); setMaxPrice(""); }}
              className="inline-flex items-center gap-2 text-xs font-bold text-error/60 hover:text-error transition-colors pt-4 border-t border-primary/5"
            >
              <span className="material-symbols-outlined text-[16px]">refresh</span>
              Đặt lại bộ lọc
            </button>
          </div>
        </aside>

        {/* Danh sách sản phẩm */}
        <section className="flex-grow min-w-0">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-10 gap-6">
            <div>
              <h1 className="text-4xl font-display font-bold text-foreground">
                {keyword ? `Kết quả: "${keyword}"` : (isRentPage ? "Thuê đồ dùng" : "Mua sắm")}
              </h1>
              <p className="text-on-surface-variant font-medium mt-1">Tìm thấy {featuredProducts.length + products.length} món đồ chất lượng</p>
            </div>
            <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-pill shadow-sm border border-primary/5">
              <span className="text-xs font-bold text-on-surface-variant/60 uppercase tracking-widest">Sắp xếp:</span>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
                className="bg-transparent text-sm font-bold text-primary outline-none cursor-pointer">
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
                <div className="h-1 w-12 bg-secondary rounded-full mt-1"></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {featuredProducts.map((product) => {
                  const displayPrice = product.productType === "rent"
                    ? `${formatPrice(product.rentPricePerDay)}/ngày`
                    : formatPrice(product.salePrice);

                  return (
                    <article
                      key={product._id}
                      onClick={() => navigate(`/marketplaces/${product._id}`)}
                      className="cursor-pointer group flex flex-col bg-white rounded-organic overflow-hidden border border-primary/10 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/5"
                    >
                      <div className="relative aspect-square overflow-hidden bg-background">
                        <img alt={product.title} src={product.thumbnailUrl || "https://placehold.co/600x600?text=EcoTrade"} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                        <div className="absolute top-4 left-4">
                          <span className="bg-secondary text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-lg">Nổi bật</span>
                        </div>
                        {product.ownerIsPro && (
                          <div className="absolute bottom-4 right-4 bg-white/90 p-1.5 rounded-xl shadow-sm">
                            <ProBadge />
                          </div>
                        )}
                      </div>
                      <div className="p-6 flex flex-col flex-grow">
                        <h3 className="line-clamp-2 font-display font-bold text-lg text-foreground mb-4 group-hover:text-primary transition-colors">{product.title}</h3>
                        <div className="mt-auto flex justify-between items-end border-t border-primary/5 pt-4">
                          <p className="text-2xl font-display font-black text-primary">{displayPrice}</p>
                          <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px]">location_on</span>
                            {product.location?.split(',')[0] || "Hòa Lạc"}
                          </span>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center items-center py-24">
              <span className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></span>
            </div>
          ) : products.length === 0 && featuredProducts.length === 0 ? (
            <div className="text-center py-24 bg-white rounded-organic border border-primary/5">
              <span className="material-symbols-outlined text-6xl text-primary/20 block mb-4">search_off</span>
              <p className="text-on-surface-variant font-medium">Không tìm thấy sản phẩm phù hợp.</p>
              <button onClick={() => { setSelectedCat("Tất cả"); setSelectedCond("Tất cả"); setMinPrice(""); setMaxPrice(""); }}
                className="mt-4 text-primary font-bold hover:underline">Xóa tất cả bộ lọc</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {products.map((product) => {
                const conditionLabel = mapStatusToCondition(product.conditionStatus);
                const conditionColor = product.conditionStatus === "new" || product.conditionStatus === "like_new"
                  ? "bg-primary text-white"
                  : "bg-background text-on-surface-variant";

                const displayPrice = product.productType === "rent"
                  ? `${formatPrice(product.rentPricePerDay)}/ngày`
                  : formatPrice(product.salePrice);

                return (
                  <article key={product._id} onClick={() => navigate(`/marketplaces/${product._id}`)}
                    className="group flex flex-col bg-white rounded-organic overflow-hidden border border-primary/5 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/5 cursor-pointer">
                    <div className="relative aspect-square bg-background overflow-hidden">
                      <img alt={product.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" src={product.thumbnailUrl || "https://placehold.co/600x600?text=EcoTrade"} />
                      <div className="absolute top-4 left-4 flex gap-2">
                        <span className={`px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm ${conditionColor}`}>
                          {conditionLabel}
                        </span>
                        {product.productType === "rent" && (
                          <span className="px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-secondary text-white shadow-sm">Thuê</span>
                        )}
                      </div>
                    </div>
                    <div className="p-5 flex flex-col flex-grow">
                      <div className="flex justify-between items-start mb-3 gap-2">
                        <h2 className="font-display font-bold text-foreground text-base leading-tight flex-1 line-clamp-2 group-hover:text-primary transition-colors">{product.title}</h2>
                        <span className="text-primary font-black text-lg whitespace-nowrap">{displayPrice}</span>
                      </div>
                      
                      <div className="mt-auto pt-4 border-t border-primary/5 flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          {product.ownerId?.avatarUrl ? (
                            <img src={product.ownerId.avatarUrl} alt="" className="w-5 h-5 rounded-full object-cover" />
                          ) : (
                            <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="material-symbols-outlined text-[10px] text-primary">person</span>
                            </div>
                          )}
                          <span className="text-[11px] font-bold text-on-surface-variant truncate max-w-[80px]">{product.ownerId?.fullName || "EcoTrader"}</span>
                        </div>
                        <div className="flex items-center gap-1 text-on-surface-variant">
                          <span className="material-symbols-outlined text-[14px]">location_on</span>
                          <span className="text-[11px] font-medium truncate max-w-[70px]">{product.location?.split(',')[0] || "Hòa Lạc"}</span>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
};
export default Marketplace;
