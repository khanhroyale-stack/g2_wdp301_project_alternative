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
        if (res.success) setProducts(res.data);
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
    <div className="min-h-screen bg-[#F5F5F7] flex flex-col">
      <Navbar />

      <main className="flex-grow pt-24 pb-16 px-4 md:px-10 max-w-[1400px] mx-auto w-full flex flex-col md:flex-row gap-6">
        {/* Sidebar filter */}
        <aside className="w-full md:w-64 flex-shrink-0">
          <div className="sticky top-24 bg-surface-container-lowest rounded-2xl shadow-apple p-6 flex flex-col gap-5 border border-surface-variant/30">
            <div>
              <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-3">Danh mục</h3>
              <ul className="flex flex-col gap-1">
                <li>
                  <button onClick={() => setSelectedCat("Tất cả")}
                    className={`w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${selectedCat === "Tất cả" ? "bg-primary/10 text-primary font-semibold" : "text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface"}`}>
                    {selectedCat === "Tất cả" && <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />}
                    Tất cả
                  </button>
                </li>
                {categories.map((cat) => (
                  <li key={cat._id}>
                    <button onClick={() => setSelectedCat(cat._id)}
                      className={`w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${selectedCat === cat._id ? "bg-primary/10 text-primary font-semibold" : "text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface"}`}>
                      {selectedCat === cat._id && <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />}
                      {cat.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="border-t border-surface-variant pt-5">
              <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-3">Khoảng giá (₫)</h3>
              <div className="flex items-center gap-2">
                <input className={inputCls} placeholder="Từ" type="number" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} />
                <span className="text-on-surface-variant text-sm">–</span>
                <input className={inputCls} placeholder="Đến" type="number" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} />
              </div>
            </div>

            <div className="border-t border-surface-variant pt-5">
              <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-3">Tình trạng</h3>
              <ul className="flex flex-col gap-1">
                {CONDITIONS.map((cond) => (
                  <li key={cond}>
                    <button onClick={() => setSelectedCond(cond)}
                      className={`w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${selectedCond === cond ? "bg-primary/10 text-primary font-semibold" : "text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface"}`}>
                      {selectedCond === cond && <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />}
                      {cond}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <button
              onClick={() => { setSelectedCat("Tất cả"); setSelectedCond("Tất cả"); setMinPrice(""); setMaxPrice(""); }}
              className="text-xs text-on-surface-variant hover:text-error transition-colors text-left border-t border-surface-variant pt-4 flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[14px]">filter_alt_off</span>
              Xóa bộ lọc
            </button>
          </div>
        </aside>

        {/* Danh sách sản phẩm */}
        <section className="flex-grow min-w-0">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <div>
              <h1 className="text-2xl font-bold text-on-surface">
                {keyword ? `Kết quả tìm kiếm: "${keyword}"` : (isRentPage ? "Thuê đồ" : "Mua sắm")}
              </h1>
              <p className="text-sm text-on-surface-variant mt-0.5">Tìm thấy {products.length} sản phẩm</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-on-surface-variant">Sắp xếp:</span>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
                className="bg-surface-container-lowest border border-surface-variant rounded-lg px-3 py-1.5 text-sm text-on-surface focus:border-primary outline-none cursor-pointer">
                <option value="newest">Mới nhất</option>
                <option value="price_asc">Giá tăng dần</option>
                <option value="price_desc">Giá giảm dần</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-24">
              <span className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></span>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-24">
              <span className="material-symbols-outlined text-6xl text-on-surface-variant/40 block mb-4">search_off</span>
              <p className="text-on-surface-variant font-medium">Không tìm thấy sản phẩm phù hợp.</p>
              <button onClick={() => { setSelectedCat("Tất cả"); setSelectedCond("Tất cả"); setMinPrice(""); setMaxPrice(""); }}
                className="mt-4 text-primary text-sm hover:underline">Xóa bộ lọc</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {products.map((product) => {
                const conditionLabel = mapStatusToCondition(product.conditionStatus);
                const conditionColor = product.conditionStatus === "new" || product.conditionStatus === "like_new"
                  ? "bg-secondary-container text-on-secondary-container"
                  : "bg-surface-variant text-on-surface";

                const displayPrice = product.productType === "rent"
                  ? `${formatPrice(product.rentPricePerDay)}/ngày`
                  : formatPrice(product.salePrice);

                return (
                  <article key={product._id} onClick={() => navigate(`/marketplaces/${product._id}`)}
                    className="bg-surface-container-lowest rounded-2xl shadow-apple overflow-hidden flex flex-col hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group border border-transparent hover:border-surface-variant">
                    <div className="relative aspect-square bg-surface-container-low overflow-hidden">
                      {getImageUrl(product.thumbnailUrl) ? (
                        <img
                          alt={product.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          src={getImageUrl(product.thumbnailUrl)}
                          onError={(e) => { e.target.style.display = "none"; e.target.nextSibling.style.display = "flex"; }}
                        />
                      ) : null}
                      <div className={`absolute inset-0 flex items-center justify-center bg-surface-container-low flex-col gap-2 ${getImageUrl(product.thumbnailUrl) ? "hidden" : "flex"}`}>
                        <span className="material-symbols-outlined text-4xl text-on-surface-variant/30">image</span>
                        <span className="text-xs text-on-surface-variant/50">Chưa có ảnh</span>
                      </div>
                      <span className={`absolute top-3 left-3 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${conditionColor}`}>
                        {conditionLabel}
                      </span>
                      {product.productType === "rent" && (
                        <span className="absolute top-3 right-3 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-primary text-on-primary">
                          Thuê
                        </span>
                      )}
                    </div>
                    <div className="p-4 flex flex-col flex-grow">
                      <div className="flex justify-between items-start mb-1.5">
                        <h2 className="font-semibold text-on-surface text-sm leading-tight flex-1 mr-2 line-clamp-2">{product.title}</h2>
                        <span className="text-primary font-bold text-base whitespace-nowrap">{displayPrice}</span>
                      </div>
                      <p className="text-on-surface-variant text-xs mb-3 line-clamp-2 leading-relaxed flex-1">{product.description}</p>

                      {/* Tên người cho thuê / người bán */}
                      {product.ownerId && (
                        <div className="flex items-center gap-1.5 mb-3">
                          {product.ownerId.avatarUrl ? (
                            <img src={product.ownerId.avatarUrl} alt={product.ownerId.fullName} className="w-5 h-5 rounded-full object-cover flex-shrink-0" />
                          ) : (
                            <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                              <span className="material-symbols-outlined text-[11px] text-primary">person</span>
                            </div>
                          )}
                          <span className="text-xs text-on-surface-variant truncate">
                            {product.ownerId.fullName || product.ownerId.name || "Ẩn danh"}
                          </span>
                          {product.ownerIsPro && <ProBadge />}
                          {product.ownerId.reputationScore != null && (
                            <span className="ml-auto flex items-center gap-0.5 text-[10px] text-primary bg-primary/10 px-1.5 py-0.5 rounded-full whitespace-nowrap">
                              <span className="material-symbols-outlined text-[11px]">verified_user</span>
                              {product.ownerId.reputationScore}
                            </span>
                          )}
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-on-surface-variant">
                          <span className="material-symbols-outlined text-[13px]">location_on</span>
                          <span className="text-xs truncate max-w-[120px]">{product.location}</span>
                        </div>
                        <div className="flex items-center gap-0.5 text-amber-500">
                          <span className="material-symbols-outlined text-[13px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                          <span className="text-xs font-semibold">{(product.ownerId?.averageRating || 0).toFixed(1)}</span>
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
