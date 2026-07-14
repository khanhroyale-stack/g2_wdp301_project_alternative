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
    <div className="min-h-screen bg-background flex flex-col font-sans selection:bg-primary/20">
      <Navbar />

      {/* Hero Section */}
      <section className="pt-32 pb-24 px-4 md:px-10 text-center relative overflow-hidden leaf-texture">
        {/* Organic background blobs */}
        <div className="absolute top-[-5%] left-[-5%] w-[30rem] h-[30rem] bg-primary/10 blur-[100px] rounded-full animate-blob"></div>
        <div className="absolute bottom-[10%] right-[-5%] w-[25rem] h-[25rem] bg-secondary/15 blur-[100px] rounded-full animate-blob animation-delay-2000"></div>

        <div className="relative z-10 max-w-5xl mx-auto">
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary/10 border border-primary/20 mb-10 shadow-sm">
            <span className="material-symbols-outlined text-primary text-[20px]">eco</span>
            <span className="text-[11px] font-black text-primary uppercase tracking-[0.25em]">Sống xanh cùng Hòa Lạc</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-display font-extrabold text-foreground tracking-tight mb-10 leading-[1.15]">
            Trao đổi thông minh <br className="hidden sm:block" />
            <span className="text-primary italic">Xây dựng tương lai</span>
          </h1>
          
          <p className="text-on-surface-variant text-base md:text-lg mb-14 max-w-xl mx-auto leading-relaxed font-medium opacity-90">
            Nền tảng mua bán và cho thuê đồ dùng bền vững dành cho cộng đồng sinh viên. Giảm lãng phí, tăng giá trị cho mọi người.
          </p>

          {/* Search bar */}
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
            <div className="flex items-center bg-white rounded-pill p-1.5 shadow-2xl shadow-primary/5 border border-primary/10 focus-within:border-primary/30 focus-within:shadow-primary/10 transition-all duration-500">
              <div className="flex items-center flex-1 px-4">
                <span className="material-symbols-outlined text-on-surface-variant/40 mr-3">search</span>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Bạn đang cần tìm món đồ gì?"
                  className="flex-1 bg-transparent border-none outline-none text-foreground text-lg placeholder:text-on-surface-variant/30"
                />
              </div>
              <button type="submit"
                className="px-8 py-3.5 bg-primary text-white rounded-pill text-base font-bold hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20 transition-all active:scale-[0.98]">
                Tìm kiếm
              </button>
            </div>
          </form>

          <div className="flex flex-wrap gap-2.5 justify-center mt-12">
            <span className="text-[10px] font-black text-on-surface-variant/40 py-2 mr-2 uppercase tracking-[0.2em]">Gợi ý:</span>
            {["Laptop cũ", "Sách giáo trình", "Xe đạp", "Quạt sinh viên", "Máy ảnh"].map((tag) => (
              <button key={tag} onClick={() => navigate(`/marketplaces?q=${tag}`)}
                className="px-6 py-2.5 bg-white/40 backdrop-blur-md border border-primary/5 rounded-full text-xs font-bold text-primary/80 hover:bg-primary hover:text-white hover:border-primary transition-all duration-300 shadow-sm">
                {tag}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Sản phẩm nổi bật */}
      <section className="py-24 px-4 md:px-10 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
            <div>
              <h2 className="text-4xl font-display font-bold text-foreground mb-4">Sản phẩm nổi bật</h2>
              <div className="h-1.5 w-24 bg-secondary rounded-full"></div>
            </div>
            <Link to="/marketplaces" className="inline-flex items-center gap-2 text-primary font-bold hover:gap-3 transition-all group">
              Khám phá tất cả <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">east</span>
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="animate-pulse bg-background rounded-organic h-96"></div>
              ))}
            </div>
          ) : featuredProducts.length === 0 ? (
            <div className="text-center text-on-surface-variant py-20 bg-background rounded-organic">
              Chưa có sản phẩm nổi bật nào.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {featuredProducts.map((product) => {
                const isRent = product.productType === "rent" || product.productType === "both";
                const price = isRent
                  ? `${product.rentPricePerDay?.toLocaleString()}đ/ngày`
                  : `${product.salePrice?.toLocaleString()}đ`;
                
                return (
                  <Link key={product._id} to={`/san-pham/${product._id}`}
                    className="group flex flex-col bg-background rounded-organic overflow-hidden border border-primary/5 hover:border-primary/20 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/5">
                    <div className="relative aspect-square overflow-hidden bg-surface-container-low">
                      <img
                        src={product.thumbnailUrl || "https://placehold.co/600x600?text=EcoTrade"}
                        alt={product.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                      <div className="absolute top-4 left-4 flex gap-2">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest backdrop-blur-md shadow-sm ${isRent ? "bg-secondary text-white" : "bg-primary text-white"}`}>
                          {isRent ? "Cho thuê" : "Bán"}
                        </span>
                      </div>
                      {product.isFeatured && (
                        <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm p-2 rounded-xl shadow-sm">
                           <span className="material-symbols-outlined text-amber-500 text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>workspace_premium</span>
                        </div>
                      )}
                    </div>
                    <div className="p-6 flex flex-col flex-grow">
                      <h3 className="font-display font-bold text-foreground text-lg leading-tight mb-3 line-clamp-2 group-hover:text-primary transition-colors">{product.title}</h3>
                      <div className="mt-auto pt-4 border-t border-primary/5 flex justify-between items-center">
                        <div>
                          <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1">{isRent ? "Giá thuê / ngày" : "Giá bán"}</p>
                          <p className="text-xl font-display font-black text-primary">{price}</p>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-primary/5 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
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
      <section className="py-24 px-4 md:px-10 bg-background overflow-hidden relative">
        <div className="absolute top-1/2 left-0 -translate-y-1/2 w-64 h-64 bg-secondary/5 blur-[80px] rounded-full"></div>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-display font-bold text-foreground mb-4">Khám phá theo danh mục</h2>
            <p className="text-on-surface-variant font-medium">Tìm kiếm chính xác món đồ bạn cần theo từng nhóm hàng.</p>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6">
            {CATEGORIES.map((cat) => (
              <Link key={cat.label} to={`/marketplaces?category=${cat.q}`}
                className="group flex flex-col items-center gap-4">
                <div className="relative w-full aspect-square rounded-organic overflow-hidden shadow-sm group-hover:shadow-xl transition-all duration-500 group-hover:-translate-y-2">
                  <img src={cat.img} alt={cat.label} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-primary/20 group-hover:bg-transparent transition-all duration-500"></div>
                  <div className="absolute inset-0 flex items-center justify-center bg-black/10 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="material-symbols-outlined text-white text-4xl">{cat.icon}</span>
                  </div>
                </div>
                <span className="font-display font-bold text-foreground group-hover:text-primary transition-colors">{cat.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-4 md:px-10 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div>
              <h2 className="text-5xl font-display font-bold text-foreground mb-8 leading-tight">Giao dịch <br /> <span className="text-primary italic">An toàn & Tin cậy</span></h2>
              <div className="space-y-8">
                {FEATURES.map((f) => (
                  <div key={f.title} className="flex gap-6 group">
                    <div className="w-16 h-16 rounded-2xl bg-background flex items-center justify-center flex-shrink-0 group-hover:bg-primary transition-colors">
                      <span className="material-symbols-outlined text-3xl text-primary group-hover:text-white transition-colors">{f.icon}</span>
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-xl text-foreground mb-2">{f.title}</h3>
                      <p className="text-on-surface-variant font-medium leading-relaxed">{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="aspect-square rounded-organic overflow-hidden shadow-2xl relative z-10">
                <img src="https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&q=80" alt="Sustainability" className="w-full h-full object-cover" />
              </div>
              <div className="absolute -top-10 -right-10 w-48 h-48 bg-secondary/20 rounded-organic animate-pulse"></div>
              <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-primary/20 rounded-organic animate-bounce duration-[3000ms]"></div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-4 md:px-10 bg-white">
        <div className="max-w-7xl mx-auto rounded-[3rem] bg-primary relative overflow-hidden p-12 md:p-24 text-center">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 blur-[80px] rounded-full translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary/20 blur-[60px] rounded-full -translate-x-1/2 translate-y-1/2"></div>
          
          <div className="relative z-10">
            <h2 className="text-4xl md:text-6xl font-display font-extrabold text-white mb-8 leading-tight">Đừng để lãng phí <br className="md:hidden" /> món đồ của bạn</h2>
            <p className="text-white/80 text-lg md:text-xl mb-12 max-w-2xl mx-auto font-medium">
              Đăng tin miễn phí, bán hoặc cho thuê những vật dụng bạn không cần dùng đến. Giúp ích cho cộng đồng sinh viên.
            </p>
            <Link to="/dang-tin"
              className="inline-flex items-center gap-3 px-10 py-5 bg-secondary text-white font-bold rounded-pill hover:scale-105 transition-all shadow-xl hover:shadow-secondary/30 text-lg group">
              Bắt đầu đăng tin <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};
export default Home;
