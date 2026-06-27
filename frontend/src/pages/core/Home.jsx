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
  { icon: "shield", title: "Xác minh email OTP", desc: "An toàn tuyệt đối cho mọi giao dịch." },
  { icon: "star", title: "Hệ thống điểm uy tín", desc: "Đánh giá minh bạch từ cộng đồng." },
  { icon: "local_shipping", title: "Shipper kiểm tra hàng", desc: "Đảm bảo chất lượng trước khi thanh toán." },
];

const HOW_STEPS = [
  { icon: "edit_note", title: "Đăng tin", desc: "Đăng món đồ bạn muốn bán hoặc cho thuê chỉ trong vài phút — hoàn toàn miễn phí." },
  { icon: "forum", title: "Kết nối & Trao đổi", desc: "Nhắn tin trực tiếp với người mua/thuê để thống nhất giá cả và thời gian." },
  { icon: "verified", title: "Giao dịch an toàn", desc: "Shipper kiểm tra hàng, thanh toán đảm bảo và đánh giá uy tín sau giao dịch." },
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
          setFeaturedProducts(res.data);
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
    <div className="min-h-screen bg-surface flex flex-col font-sans">
      <Navbar />

      {/* Hero Section with animated gradient */}
      <section className="pt-32 pb-24 px-4 md:px-10 text-center relative overflow-hidden">
        {/* Decorative background blobs */}
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-primary/20 blur-3xl rounded-full mix-blend-multiply opacity-70 animate-blob"></div>
        <div className="absolute top-[20%] right-[-10%] w-96 h-96 bg-secondary/20 blur-3xl rounded-full mix-blend-multiply opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-[-20%] left-[20%] w-96 h-96 bg-tertiary/20 blur-3xl rounded-full mix-blend-multiply opacity-70 animate-blob animation-delay-4000"></div>

        <div className="relative z-10">
          <p className="text-xs font-bold text-primary uppercase tracking-widest mb-4 inline-block bg-primary/10 px-3 py-1 rounded-full border border-primary/20">Khu vực Hòa Lạc</p>
          <h1 className="text-5xl md:text-7xl font-extrabold text-on-surface tracking-tight mb-6 leading-tight">
            Khám phá mọi thứ tại <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-tertiary">EcoTrade</span>
          </h1>
          <p className="text-on-surface-variant text-lg md:text-xl mb-12 max-w-2xl mx-auto leading-relaxed">
            Nền tảng trao đổi, mua bán và cho thuê đồ dùng chất lượng, uy tín dành riêng cho sinh viên tại Hòa Lạc.
          </p>

          {/* Search bar */}
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto group">
            <div className="flex items-center bg-white/80 backdrop-blur-xl rounded-full px-5 py-4 border border-surface-variant/40 shadow-xl shadow-surface-variant/20 group-hover:border-primary/40 group-hover:shadow-primary/10 transition-all duration-300">
              <span className="material-symbols-outlined text-on-surface-variant mr-3 group-hover:text-primary transition-colors">search</span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Bạn đang tìm gì hôm nay?"
                className="flex-1 bg-transparent border-none outline-none text-on-surface text-lg placeholder:text-on-surface-variant/70"
              />
              <button type="submit"
                className="ml-3 px-8 py-3 bg-gradient-to-r from-primary to-primary-fixed text-on-primary rounded-full text-base font-bold hover:shadow-lg hover:shadow-primary/30 transition-all flex-shrink-0 active:scale-95">
                Tìm kiếm
              </button>
            </div>
          </form>

          {/* Quick tags */}
          <div className="flex flex-wrap gap-3 justify-center mt-8">
            <span className="text-sm font-medium text-on-surface-variant py-1.5 mr-2">Gợi ý:</span>
            {["Laptop cũ", "Sách giáo trình", "Xe đạp", "Quạt sinh viên", "Máy ảnh"].map((tag) => (
              <button key={tag} onClick={() => navigate(`/marketplaces?q=${tag}`)}
                className="px-4 py-1.5 bg-white/50 backdrop-blur-sm border border-surface-variant/50 rounded-full text-sm font-medium text-on-surface-variant hover:bg-primary hover:text-on-primary hover:border-primary transition-all duration-300 hover:-translate-y-0.5 hover:shadow-sm">
                {tag}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 md:px-10 bg-surface">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-on-surface mb-4">An toàn, Tiện lợi, Uy tín</h2>
            <p className="text-on-surface-variant max-w-2xl mx-auto text-lg">EcoTrade xây dựng một cộng đồng văn minh, nơi mọi giao dịch đều được đảm bảo với quy trình rõ ràng.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {FEATURES.map((f) => (
              <div key={f.title}
                className="bg-white rounded-3xl p-8 flex flex-col items-center text-center shadow-sm border border-surface-variant/20 hover:shadow-xl hover:-translate-y-1 hover:border-primary/20 transition-all duration-300 group">
                <div className="w-16 h-16 rounded-2xl bg-secondary-container/50 group-hover:bg-secondary-container flex items-center justify-center mb-6 transition-colors">
                  <span className="material-symbols-outlined text-3xl text-on-secondary-container">{f.icon}</span>
                </div>
                <h3 className="font-bold text-on-surface text-xl mb-3">{f.title}</h3>
                <p className="text-on-surface-variant text-base leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Cách hoạt động */}
      <section className="py-20 px-4 md:px-10 bg-surface-container-lowest">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-bold text-primary uppercase tracking-widest mb-3">Đơn giản - Nhanh chóng</p>
            <h2 className="text-3xl font-bold text-on-surface mb-4">Cách hoạt động</h2>
            <p className="text-on-surface-variant max-w-2xl mx-auto text-lg">Chỉ với 3 bước để bắt đầu mua, bán hoặc cho thuê trên EcoTrade.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {HOW_STEPS.map((step, i) => (
              <div key={step.title} className="relative flex flex-col items-center text-center">
                <div className="relative mb-6">
                  <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary to-tertiary flex items-center justify-center shadow-lg shadow-primary/20">
                    <span className="material-symbols-outlined text-3xl text-white">{step.icon}</span>
                  </div>
                  <span className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-white border-2 border-primary text-primary font-black text-sm flex items-center justify-center shadow-sm">
                    {i + 1}
                  </span>
                </div>
                <h3 className="font-bold text-on-surface text-xl mb-3">{step.title}</h3>
                <p className="text-on-surface-variant text-base leading-relaxed max-w-xs">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sản phẩm nổi bật */}
      <section className="py-20 px-4 md:px-10 bg-surface">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="text-3xl font-bold text-on-surface mb-2">Đăng bán mới nhất</h2>
              <p className="text-on-surface-variant text-lg">Những món đồ vừa được lên kệ.</p>
            </div>
            <Link to="/marketplaces" className="text-primary font-semibold hover:text-primary-fixed transition-colors flex items-center gap-1 group">
              Xem tất cả <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">arrow_forward</span>
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="animate-pulse bg-surface-container-low rounded-3xl h-80"></div>
              ))}
            </div>
          ) : featuredProducts.length === 0 ? (
            <div className="text-center text-on-surface-variant py-10 bg-surface-container-low rounded-3xl">
              Chưa có sản phẩm nào
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredProducts.map((product) => {
                const isRent = product.productType === "rent" || product.productType === "both";
                const price = isRent
                  ? `${product.rentPricePerDay?.toLocaleString()}đ/ngày`
                  : `${product.salePrice?.toLocaleString()}đ`;
                const conditionLabel = {
                  new: "Mới", like_new: "Như mới", good: "Còn tốt", fair: "Trung bình", poor: "Cũ",
                };
                return (
                  <Link key={product._id} to={`/san-pham/${product._id}`}
                    className="bg-white rounded-3xl overflow-hidden shadow-sm border border-surface-variant/20 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group flex flex-col">
                    <div className="relative aspect-[4/3] overflow-hidden bg-surface-container-low">
                      <img
                        src={product.thumbnailUrl || "https://placehold.co/600x400?text=No+Image"}
                        alt={product.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <span className={`absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-md ${isRent ? "bg-primary/90 text-white" : "bg-white/90 text-primary"
                        }`}>
                        {isRent ? "Cho thuê" : "Bán"}
                      </span>
                    </div>
                    <div className="p-5 flex flex-col flex-grow">
                      <h3 className="font-bold text-on-surface text-lg leading-snug mb-2 line-clamp-2 group-hover:text-primary transition-colors">{product.title}</h3>
                      <div className="mt-auto flex justify-between items-end">
                        <span className="text-primary font-black text-xl">{price}</span>
                        <span className="text-xs text-on-surface-variant bg-surface-container-low px-2 py-1 rounded-md">
                          {conditionLabel[product.conditionStatus] || product.conditionStatus}
                        </span>
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
      <section className="py-20 px-4 md:px-10 bg-surface">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-on-surface mb-4">Khám phá theo danh mục</h2>
            <p className="text-on-surface-variant text-lg">Tìm kiếm chính xác món đồ bạn cần.</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {CATEGORIES.map((cat) => (
              <Link key={cat.label} to={`/marketplaces?category=${cat.q}`}
                className="group relative rounded-3xl overflow-hidden aspect-square shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 block">
                <img src={cat.img} alt={cat.label} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />
                <div className="absolute inset-0 p-5 flex flex-col justify-end items-center text-center">
                  <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center mb-3 group-hover:-translate-y-2 transition-transform duration-300">
                    <span className="material-symbols-outlined text-white text-xl">{cat.icon}</span>
                  </div>
                  <span className="text-white text-base font-bold drop-shadow-md">{cat.label}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-4 md:px-10 bg-surface relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary to-tertiary opacity-95"></div>
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1600&q=80')] bg-cover bg-center mix-blend-overlay opacity-20"></div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6 leading-tight">Đừng để đồ dùng của bạn <br /> lãng phí trong góc phòng</h2>
          <p className="text-white/80 text-lg md:text-xl mb-10 max-w-2xl mx-auto leading-relaxed">Đăng tin miễn phí ngay hôm nay. Bán hoặc cho thuê những vật dụng bạn không cần dùng đến, giúp ích cho cộng đồng và tạo ra thu nhập.</p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link to="/dang-tin"
              className="px-8 py-4 bg-white text-primary font-extrabold rounded-full hover:scale-105 transition-all shadow-xl text-lg hover:shadow-2xl">
              Đăng tin miễn phí
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};
export default Home;
