import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import productService from "../../services/product.service";

const CATEGORIES = [
  { label: "Điện tử", icon: "laptop", img: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&q=80", q: "Điện tử" },
  { label: "Thời trang", icon: "checkroom", img: "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=400&q=80", q: "Thời trang" },
  { label: "Nội thất", icon: "chair", img: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&q=80", q: "Nội thất" },
  { label: "Xe cộ", icon: "directions_car", img: "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=400&q=80", q: "Xe cộ" },
  { label: "Sách", icon: "menu_book", img: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&q=80", q: "Sách" },
  { label: "Thể thao", icon: "sports_soccer", img: "https://images.unsplash.com/photo-1461897104016-0b3b00cc81ee?w=400&q=80", q: "Thể thao" },
];

const FEATURES = [
  { icon: "shield", title: "Xác minh CCCD", desc: "An toàn tuyệt đối cho mọi giao dịch." },
  { icon: "star", title: "Hệ thống điểm uy tín", desc: "Đánh giá minh bạch từ cộng đồng." },
  { icon: "local_shipping", title: "Shipper kiểm tra hàng", desc: "Đảm bảo chất lượng trước khi thanh toán." },
];

const Home = () => {
  const [search, setSearch] = useState("");
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const res = await productService.getProducts({ limit: 4, sort: "newest" });
        if (res.success) {
          const featured = Array.isArray(res.data) ? [] : res.data?.featuredProducts;
          setFeaturedProducts(featured || []);
        }
      } catch (err) {
        console.error("Lỗi lấy sản phẩm nổi bật:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchFeatured();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    navigate(`/marketplaces${search.trim() ? `?q=${encodeURIComponent(search)}` : ""}`);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans selection:bg-primary/15">
      <Navbar />

      {/* Hero Section */}
      <section className="pt-32 pb-20 md:pt-40 md:pb-28 px-4 md:px-10 text-center relative overflow-hidden leaf-texture">
        <div className="absolute top-[-8%] left-[-6%] w-[28rem] h-[28rem] bg-primary/8 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-[5%] right-[-8%] w-[24rem] h-[24rem] bg-secondary/10 blur-[120px] rounded-full pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-pill bg-surface border border-border mb-8 shadow-card">
            <span className="material-symbols-outlined text-primary text-[18px]">eco</span>
            <span className="text-[11px] font-bold text-primary uppercase tracking-[0.2em]">
              Sống xanh cùng Hòa Lạc
            </span>
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-foreground tracking-tight mb-6 leading-[1.12]">
            Trao đổi thông minh <br className="hidden sm:block" />
            <span className="text-primary">Xây dựng tương lai</span>
          </h1>

          <p className="text-muted-foreground text-base md:text-lg mb-12 max-w-xl mx-auto leading-relaxed font-medium">
            Nền tảng mua bán và cho thuê đồ dùng bền vững dành cho cộng đồng sinh viên. Giảm lãng phí, tăng giá trị cho mọi người.
          </p>

          {/* Search bar */}
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
            <div className="flex items-center bg-surface rounded-card p-2 shadow-glass border border-border focus-within:border-primary/40 focus-within:shadow-card-hover transition-all duration-200">
              <div className="flex items-center flex-1 px-3 md:px-4 min-w-0">
                <span className="material-symbols-outlined text-muted mr-3 shrink-0">search</span>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Bạn đang cần tìm món đồ gì?"
                  className="flex-1 min-w-0 bg-transparent border-none outline-none text-foreground text-base md:text-lg font-medium placeholder:text-muted placeholder:font-normal"
                />
              </div>
              <button
                type="submit"
                className="shrink-0 px-6 md:px-8 py-3 bg-primary text-white rounded-btn text-sm md:text-base font-bold hover:bg-primary-hover transition-all duration-200 active:scale-[0.98]"
              >
                Tìm kiếm
              </button>
            </div>
          </form>

          <div className="flex flex-wrap gap-2 justify-center mt-8">
            <span className="text-[11px] font-bold text-muted py-2 mr-1 uppercase tracking-[0.16em]">
              Gợi ý:
            </span>
            {["Laptop cũ", "Sách giáo trình", "Xe đạp", "Quạt sinh viên", "Máy ảnh"].map((tag) => (
              <button
                key={tag}
                onClick={() => navigate(`/marketplaces?q=${tag}`)}
                className="px-4 py-2 bg-surface border border-border rounded-pill text-xs font-semibold text-muted-foreground hover:border-primary/40 hover:text-primary hover:bg-surface-secondary transition-all duration-200"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Sản phẩm nổi bật */}
      <section className="et-section bg-surface">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
            <div>
              <h2 className="text-3xl md:text-4xl font-extrabold text-foreground mb-3">
                Sản phẩm nổi bật
              </h2>
              <div className="h-1 w-16 bg-primary rounded-pill" />
            </div>
            <Link
              to="/marketplaces"
              className="inline-flex items-center gap-2 text-primary font-bold hover:gap-3 transition-all duration-200 group"
            >
              Khám phá tất cả
              <span className="material-symbols-outlined text-[20px] group-hover:translate-x-0.5 transition-transform duration-200">
                east
              </span>
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="animate-pulse bg-surface-secondary rounded-card h-96" />
              ))}
            </div>
          ) : featuredProducts.length === 0 ? (
            <div className="text-center text-muted-foreground py-20 bg-surface-secondary rounded-card font-medium">
              Chưa có sản phẩm nổi bật nào.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
              {featuredProducts.map((product) => {
                const isRent = product.productType === "rent" || product.productType === "both";
                const price = isRent
                  ? `${product.rentPricePerDay?.toLocaleString()}đ/ngày`
                  : `${product.salePrice?.toLocaleString()}đ`;

                return (
                  <Link
                    key={product._id}
                    to={`/san-pham/${product._id}`}
                    className="group et-card et-card-hover flex flex-col overflow-hidden"
                  >
                    <div className="relative aspect-[4/3] overflow-hidden bg-surface-secondary m-3 mb-0 rounded-image">
                      <img
                        src={product.thumbnailUrl || "https://placehold.co/600x600?text=EcoTrade"}
                        alt={product.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute top-3 left-3 flex gap-2">
                        <span
                          className={`et-badge shadow-sm ${
                            isRent ? "bg-secondary text-white" : "bg-primary text-white"
                          }`}
                        >
                          {isRent ? "Cho thuê" : "Bán"}
                        </span>
                      </div>
                      {product.isFeatured && (
                        <div className="absolute bottom-3 right-3 bg-surface/95 backdrop-blur-sm p-2 rounded-btn shadow-card">
                          <span
                            className="material-symbols-outlined text-warning text-[18px]"
                            style={{ fontVariationSettings: "'FILL' 1" }}
                          >
                            workspace_premium
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="p-5 flex flex-col flex-grow">
                      <h3 className="font-bold text-foreground text-base leading-snug mb-4 line-clamp-2 group-hover:text-primary transition-colors duration-200">
                        {product.title}
                      </h3>
                      <div className="mt-auto pt-4 border-t border-border flex justify-between items-center">
                        <div>
                          <p className="text-[11px] font-semibold text-muted uppercase tracking-wider mb-1">
                            {isRent ? "Giá thuê / ngày" : "Giá bán"}
                          </p>
                          <p className="text-xl font-extrabold text-primary">{price}</p>
                        </div>
                        <div className="w-10 h-10 rounded-btn bg-surface-secondary text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all duration-200">
                          <span className="material-symbols-outlined text-[20px]">shopping_cart</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Danh mục */}
      <section className="et-section bg-background relative overflow-hidden">
        <div className="absolute top-1/2 left-0 -translate-y-1/2 w-64 h-64 bg-primary/5 blur-[80px] rounded-full pointer-events-none" />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-extrabold text-foreground mb-3">
              Khám phá theo danh mục
            </h2>
            <p className="text-muted-foreground font-medium max-w-lg mx-auto">
              Tìm kiếm chính xác món đồ bạn cần theo từng nhóm hàng.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6">
            {CATEGORIES.map((cat) => (
              <Link key={cat.label} to={`/marketplaces?category=${cat.q}`} className="group flex flex-col items-center gap-3">
                <div className="relative w-full aspect-square rounded-image overflow-hidden shadow-card group-hover:shadow-card-hover group-hover:-translate-y-[3px] transition-all duration-200">
                  <img
                    src={cat.img}
                    alt={cat.label}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-primary/25 group-hover:bg-primary/10 transition-all duration-200" />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <span className="material-symbols-outlined text-white text-3xl drop-shadow-md">
                      {cat.icon}
                    </span>
                  </div>
                </div>
                <span className="font-bold text-sm text-foreground group-hover:text-primary transition-colors duration-200">
                  {cat.label}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="et-section bg-surface">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div>
              <h2 className="text-3xl md:text-5xl font-extrabold text-foreground mb-8 leading-tight">
                Giao dịch <br />
                <span className="text-primary">An toàn & Tin cậy</span>
              </h2>
              <div className="space-y-6">
                {FEATURES.map((f) => (
                  <div key={f.title} className="flex gap-5 group">
                    <div className="w-14 h-14 rounded-card bg-surface-secondary flex items-center justify-center flex-shrink-0 group-hover:bg-primary transition-colors duration-200">
                      <span className="material-symbols-outlined text-2xl text-primary group-hover:text-white transition-colors duration-200">
                        {f.icon}
                      </span>
                    </div>
                    <div className="pt-1">
                      <h3 className="font-bold text-lg text-foreground mb-1">{f.title}</h3>
                      <p className="text-muted-foreground font-medium leading-relaxed">{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="aspect-square rounded-card overflow-hidden shadow-card-hover relative z-10">
                <img
                  src="https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&q=80"
                  alt="Sustainability"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -top-6 -right-6 w-40 h-40 bg-secondary/15 rounded-card -z-0" />
              <div className="absolute -bottom-6 -left-6 w-28 h-28 bg-primary/15 rounded-card -z-0" />
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="et-section bg-background">
        <div className="max-w-7xl mx-auto rounded-card bg-primary relative overflow-hidden px-8 py-16 md:px-20 md:py-24 text-center">
          <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 blur-[80px] rounded-full translate-x-1/3 -translate-y-1/3 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-56 h-56 bg-secondary/20 blur-[60px] rounded-full -translate-x-1/3 translate-y-1/3 pointer-events-none" />

          <div className="relative z-10">
            <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-6 leading-tight">
              Đừng để lãng phí <br className="md:hidden" /> món đồ của bạn
            </h2>
            <p className="text-white/80 text-base md:text-lg mb-10 max-w-2xl mx-auto font-medium leading-relaxed">
              Đăng tin miễn phí, bán hoặc cho thuê những vật dụng bạn không cần dùng đến. Giúp ích cho cộng đồng sinh viên.
            </p>
            <Link
              to="/dang-tin"
              className="inline-flex items-center gap-3 px-8 py-4 bg-surface text-primary font-bold rounded-btn hover:bg-surface-secondary transition-all duration-200 shadow-glass text-base group active:scale-[0.98]"
            >
              Bắt đầu đăng tin
              <span className="material-symbols-outlined group-hover:translate-x-0.5 transition-transform duration-200">
                arrow_forward
              </span>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Home;
