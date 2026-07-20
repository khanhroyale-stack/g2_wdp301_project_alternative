import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import ReportModal from "../../components/ReportModal";
import { useAuth } from "../../context/AuthContext";
import cartService from "../../services/cart.service";
import chatService from "../../services/chat.service";
import productService from "../../services/product.service";

const getProductCategoryId = (product) => product?.categoryId?._id || product?.categoryId;

const flattenProductResponse = (data) => {
  if (Array.isArray(data)) return data;
  return [...(data?.featuredProducts || []), ...(data?.products || [])];
};

const ProductSuggestionCard = ({ product, onOpen, formatPrice }) => {
  const price =
    product.productType === "rent"
      ? `${formatPrice(product.rentPricePerDay)}/ngày`
      : formatPrice(product.salePrice);

  return (
    <button
      type="button"
      onClick={() => onOpen(product._id)}
      className="group overflow-hidden rounded-2xl border border-primary/5 bg-white text-left shadow-sm transition-all hover:-translate-y-1 hover:border-primary/20 hover:shadow-xl hover:shadow-primary/5"
    >
      <div className="aspect-square overflow-hidden bg-background">
        <img
          src={product.thumbnailUrl || product.images?.[0] || "https://placehold.co/480x480?text=EcoTrade"}
          alt={product.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>
      <div className="p-4">
        <div className="mb-2 flex items-center gap-2">
          <span className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-widest ${product.productType === "rent" ? "bg-secondary text-white" : "bg-primary text-white"}`}>
            {product.productType === "rent" ? "Thuê" : "Bán"}
          </span>
          <span className="truncate text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/50">
            {product.location?.split(",")[0] || "Hòa Lạc"}
          </span>
        </div>
        <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-bold leading-5 text-foreground group-hover:text-primary">
          {product.title}
        </h3>
        <p className="mt-3 text-lg font-black text-primary">{price}</p>
      </div>
    </button>
  );
};

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeImg, setActiveImg] = useState(0);
  const [showReportModal, setShowReportModal] = useState(false);
  const [purchaseQuantity, setPurchaseQuantity] = useState(1);
  const [relatedProducts, setRelatedProducts] = useState([]);

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const res = await productService.getProduct(id);
        if (res.success) {
          setProduct(res.data);
          setPurchaseQuantity(1);
        } else {
          setError(res.message);
        }
      } catch (_) {
        setError("Không thể tải thông tin sản phẩm.");
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  useEffect(() => {
    const categoryId = getProductCategoryId(product);
    if (!categoryId) {
      setRelatedProducts([]);
      return;
    }

    const fetchRelatedProducts = async () => {
      try {
        const res = await productService.getProducts({
          category: categoryId,
          sort: "newest",
          limit: 8,
        });
        if (res.success) {
          const items = flattenProductResponse(res.data)
            .filter((item) => String(item._id) !== String(product._id))
            .slice(0, 4);
          setRelatedProducts(items);
        }
      } catch {
        setRelatedProducts([]);
      }
    };

    fetchRelatedProducts();
  }, [product]);

  const getImageUrl = (img) => {
    if (!img) return "https://placehold.co/800x600?text=No+Image";
    return img;
  };

  const formatPrice = (num) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(num || 0);

  const handleBuy = async () => {
    if (!user) return navigate("/dang-nhap");
    navigate(`/dat-hang/${product._id}?quantity=${purchaseQuantity}`);
  };

  const handleAddToCart = async () => {
    if (!user) return navigate("/dang-nhap");
    try {
      const res = await cartService.addCartItem(product._id, purchaseQuantity);
      if (res.success) {
        toast.success("Da them san pham vao gio hang");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Khong the them vao gio hang");
    }
  };



  const handleChat = async () => {
    if (!user) return navigate("/dang-nhap");
    try {
      const res = await chatService.getOrCreateRoom(product.ownerId._id, product._id);
      if (res.success) navigate(`/tin-nhan/${res.data.room._id}`);
    } catch {
      toast.error("Lỗi khi mở cuộc trò chuyện");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <span className="material-symbols-outlined text-4xl text-primary animate-spin">refresh</span>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center pt-20">
          <span className="material-symbols-outlined text-6xl text-error mb-4">error</span>
          <h2 className="text-xl font-bold">{error || "Sản phẩm không tồn tại"}</h2>
          <Link to="/" className="mt-4 px-6 py-2 bg-primary text-white rounded-full hover:opacity-90 transition-all">
            Quay lại trang chủ
          </Link>
        </div>
      </div>
    );
  }

  const images = product.images?.length > 0 ? product.images : product.imageUrls?.length > 0 ? product.imageUrls : [];
  const displayPrice =
    product.productType === "rent" ? `${formatPrice(product.rentPricePerDay)}/ngày` : formatPrice(product.salePrice);
  const availableQuantity = Math.max(Number(product.quantity) || 0, 0);
  const sellerName = product.ownerId?.fullName || product.ownerId?.name || "Người dùng ẩn";
  const sellerInitial = sellerName.charAt(0).toUpperCase();
  const ownerId = product.ownerId?._id || product.ownerId;
  const currentUserId = user?.id || user?._id;
  const isOwnProduct = currentUserId && ownerId && String(currentUserId) === String(ownerId);
  const isSaleProduct = ["sale", "both"].includes(product.productType);
  const isRentProduct = ["rent", "both"].includes(product.productType);
  const isPubliclyAvailable = ["approved", "available"].includes(product.postStatus);
  const canBuyProduct = isSaleProduct && isPubliclyAvailable && availableQuantity > 0 && !isOwnProduct;
  const canRentProduct = isRentProduct && isPubliclyAvailable && availableQuantity > 0 && !isOwnProduct;

  const openReportModal = () => {
    if (!user) {
      navigate("/dang-nhap");
      return;
    }
    if (isOwnProduct) {
      toast.error("Bạn không thể báo cáo sản phẩm của chính mình.");
      return;
    }
    setShowReportModal(true);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans selection:bg-primary/20">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 md:px-10 pt-24 pb-24 w-full flex-grow">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant/40 mb-8 bg-white/40 backdrop-blur-md px-6 py-3 rounded-full w-fit border border-primary/5 shadow-sm">
          <Link to="/" className="hover:text-primary transition-colors flex items-center">
            <span className="material-symbols-outlined text-[14px] mr-1.5">home</span>
            Trang chủ
          </Link>
          <span className="material-symbols-outlined text-[12px] opacity-30">chevron_right</span>
          <Link to={product.productType === "rent" ? "/cho-thue" : "/marketplaces"} className="hover:text-primary transition-colors">
            {product.productType === "rent" ? "Thuê đồ" : "Mua sắm"}
          </Link>
          <span className="material-symbols-outlined text-[12px] opacity-30">chevron_right</span>
          <span className="text-primary truncate max-w-[200px]">{product.title}</span>
        </div>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)] lg:items-start">
          {/* Image Gallery */}
          <div className="flex flex-col gap-5">
            <div className="w-full bg-white rounded-[28px] overflow-hidden aspect-[4/3] flex items-center justify-center p-4 shadow-xl shadow-primary/5 border border-primary/5 group relative">
              {images.length > 0 && images[activeImg] ? (
                <img alt={product.title} className="w-full h-full object-contain rounded-organic group-hover:scale-105 transition-transform duration-700" src={getImageUrl(images[activeImg])} />
              ) : (
                <div className="flex flex-col items-center justify-center gap-4 text-primary/20">
                  <span className="material-symbols-outlined text-7xl">image</span>
                  <p className="text-sm font-bold uppercase tracking-widest">Chưa có ảnh</p>
                </div>
              )}
              <div className="absolute top-6 left-6 flex gap-2">
                <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] backdrop-blur-md shadow-lg ${product.productType === "rent" ? "bg-secondary text-white" : "bg-primary text-white"}`}>
                  {product.productType === "rent" ? "Cho thuê" : "Đang bán"}
                </span>
              </div>
              {images.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => setActiveImg((prev) => (prev - 1 + images.length) % images.length)}
                    className="absolute left-6 top-1/2 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-full bg-white/80 text-primary shadow-xl backdrop-blur-md transition-all hover:bg-primary hover:text-white opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100"
                    aria-label="Ảnh trước"
                  >
                    <span className="material-symbols-outlined text-[24px]">chevron_left</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveImg((prev) => (prev + 1) % images.length)}
                    className="absolute right-6 top-1/2 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-full bg-white/80 text-primary shadow-xl backdrop-blur-md transition-all hover:bg-primary hover:text-white opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100"
                    aria-label="Ảnh tiếp"
                  >
                    <span className="material-symbols-outlined text-[24px]">chevron_right</span>
                  </button>
                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 bg-black/10 backdrop-blur-md p-1.5 rounded-full">
                    {images.map((_, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setActiveImg(idx)}
                        className={`h-1.5 rounded-full transition-all ${activeImg === idx ? "w-6 bg-white" : "w-1.5 bg-white/50 hover:bg-white"}`}
                        aria-label={`Ảnh ${idx + 1}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>

            {images.length > 1 ? (
              <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
                {images.map((img, idx) => (
                  <button
                    key={`${img}-${idx}`}
                    onClick={() => setActiveImg(idx)}
                    className={`flex-shrink-0 w-24 h-24 rounded-2xl overflow-hidden border-2 transition-all duration-300 ${activeImg === idx ? "border-primary shadow-lg scale-105" : "border-transparent opacity-60 hover:opacity-100 hover:border-primary/30 bg-white"}`}
                  >
                    <img src={getImageUrl(img)} alt="" className="w-full h-full object-cover p-1 rounded-xl" />
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          {/* Product Info Panel */}
          <div className="w-full lg:sticky lg:top-24 flex flex-col gap-6 bg-white p-6 lg:p-8 rounded-[28px] shadow-xl shadow-primary/5 border border-primary/5">
            <div>
              <div className="flex items-center gap-3 mb-5 flex-wrap">
                <span className="px-4 py-1.5 rounded-full bg-primary/5 text-primary text-[10px] font-black uppercase tracking-[0.2em] border border-primary/10">
                  {product.categoryId?.name || "Sản phẩm"}
                </span>
                <span className="px-4 py-1.5 rounded-full bg-secondary/10 text-secondary text-[10px] font-black uppercase tracking-[0.2em] border border-secondary/20">
                  {product.conditionStatus === "new" ? "Mới 100%" : "Đã qua sử dụng"}
                </span>
              </div>
              <h1 className="text-3xl lg:text-4xl font-display font-bold text-foreground leading-[1.2] mb-5">{product.title}</h1>

              <div className="flex flex-col gap-1 p-5 bg-background rounded-2xl border border-primary/5">
                <p className="text-[10px] font-black text-on-surface-variant/50 uppercase tracking-widest">{product.productType === "rent" ? "Giá thuê mỗi ngày" : "Giá niêm yết"}</p>
                <p className="text-4xl font-display font-black text-primary">{displayPrice}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 rounded-2xl border border-primary/5 bg-white p-4">
              <div className="flex flex-col gap-1">
                <p className="text-[9px] font-black text-on-surface-variant/40 uppercase tracking-widest">Khu vực</p>
                <div className="flex items-center gap-1.5 text-sm font-bold text-foreground">
                  <span className="material-symbols-outlined text-primary text-[18px]">location_on</span>
                  {product.location?.split(',')[0] || "Hòa Lạc"}
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-[9px] font-black text-on-surface-variant/40 uppercase tracking-widest">Tình trạng</p>
                <div className="flex items-center gap-1.5 text-sm font-bold text-foreground">
                  <span className="material-symbols-outlined text-secondary text-[18px]">inventory_2</span>
                  {availableQuantity > 0 ? "Còn hàng" : "Hết hàng"}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              {isSaleProduct && isPubliclyAvailable ? (
                <div className="flex flex-col gap-3 bg-background p-4 rounded-2xl border border-primary/5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-on-surface-variant/60 uppercase tracking-widest">Số lượng</span>
                    <span className="text-[10px] font-black text-primary bg-primary/10 px-2 py-0.5 rounded-full">Còn {availableQuantity} sản phẩm</span>
                  </div>
                  <div className="flex items-center gap-4 w-full">
                    <button onClick={() => setPurchaseQuantity(q => Math.max(1, q - 1))} className="w-8 h-8 rounded-full bg-white border border-primary/10 flex items-center justify-center font-bold hover:bg-primary hover:text-white transition-colors">-</button>
                    <span className="font-display font-black text-lg text-center flex-1">{purchaseQuantity}</span>
                    <button onClick={() => setPurchaseQuantity(q => Math.min(availableQuantity, q + 1))} className="w-8 h-8 rounded-full bg-white border border-primary/10 flex items-center justify-center font-bold hover:bg-primary hover:text-white transition-colors">+</button>
                  </div>
                </div>
              ) : null}

              {!isPubliclyAvailable || availableQuantity <= 0 ? (
                <button disabled className="w-full py-5 rounded-pill bg-background text-on-surface-variant/40 font-black uppercase tracking-widest cursor-not-allowed">
                  Hiện không khả dụng
                </button>
              ) : isSaleProduct ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button disabled={!canBuyProduct} onClick={handleBuy} className="w-full py-5 rounded-pill bg-primary text-white font-black uppercase tracking-widest hover:shadow-xl hover:shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100">
                    Mua ngay
                  </button>
                  <button disabled={!canBuyProduct} onClick={handleAddToCart} className="w-full py-5 rounded-pill bg-white text-primary border-2 border-primary/20 font-black uppercase tracking-widest hover:bg-primary/5 transition-all disabled:cursor-not-allowed disabled:opacity-50">
                    Giỏ hàng
                  </button>
                  {isRentProduct ? (
                    <button disabled={!canRentProduct} onClick={() => (user ? navigate(`/thue/${product._id}`) : navigate("/dang-nhap"))} className="sm:col-span-2 w-full py-5 rounded-pill bg-secondary text-white font-black uppercase tracking-widest hover:shadow-xl hover:shadow-secondary/20 transition-all hover:scale-[1.02] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100">
                      Tiến hành thuê
                    </button>
                  ) : null}
                </div>
              ) : (
                <button disabled={!canRentProduct} onClick={() => (user ? navigate(`/thue/${product._id}`) : navigate("/dang-nhap"))} className="w-full py-5 rounded-pill bg-secondary text-white font-black uppercase tracking-widest hover:shadow-xl hover:shadow-secondary/20 transition-all hover:scale-[1.02] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100">
                  Tiến hành thuê
                </button>
              )}

              {(!user || !isOwnProduct) && (
                <button onClick={handleChat} className="flex items-center justify-center gap-3 w-full py-5 rounded-pill bg-background text-primary font-bold hover:bg-primary/5 transition-all">
                  <span className="material-symbols-outlined text-[20px]">chat</span>
                  Liên hệ người đăng
                </button>
              )}
            </div>

            {/* Seller Mini Card */}
            <div className="group p-6 rounded-2xl bg-background border border-primary/5 hover:border-primary/20 transition-all cursor-pointer relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 blur-2xl rounded-full translate-x-1/2 -translate-y-1/2"></div>
              <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    {product.ownerId?.avatarUrl ? (
                      <img src={product.ownerId.avatarUrl} alt={sellerName} className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-md" />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xl shadow-md border-2 border-white">
                        {sellerInitial}
                      </div>
                    )}
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-success rounded-full border-2 border-white flex items-center justify-center">
                      <span className="material-symbols-outlined text-white text-[10px] font-black">check</span>
                    </div>
                  </div>
                  <div>
                    <p className="font-display font-bold text-foreground text-lg leading-none mb-2">{sellerName}</p>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-black text-primary uppercase tracking-widest">Uy tín {product.ownerId?.reputationScore || 100}</span>
                    </div>
                  </div>
                </div>
                <span className="material-symbols-outlined text-on-surface-variant/30 group-hover:text-primary group-hover:translate-x-1 transition-all">east</span>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-primary/5 rounded-xl border border-primary/10">
              <div className="flex items-center gap-2 text-[10px] font-black text-primary uppercase tracking-widest">
                <span className="material-symbols-outlined text-[18px]">verified_user</span>
                Giao dịch được bảo vệ
              </div>
              {!isOwnProduct ? (
                <button onClick={openReportModal} className="text-[10px] font-black text-error/60 hover:text-error uppercase tracking-widest flex items-center gap-1">
                  Báo cáo đơn
                </button>
              ) : null}
            </div>
          </div>
        </div>

        {/* Detailed Description */}
        <div className="mt-14 grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
          <div className="flex flex-col gap-8">
            <section className="rounded-[28px] border border-primary/5 bg-white p-6 lg:p-8 shadow-sm">
              <h2 className="text-2xl font-display font-bold text-foreground mb-6 flex items-center gap-4">
                <div className="w-1.5 h-8 bg-primary rounded-full"></div>
                Mô tả sản phẩm
              </h2>
              <div className="text-on-surface-variant leading-relaxed space-y-5 text-base lg:text-lg font-medium opacity-90">
                {String(product.description || "").split("\n").map((para, index) => (
                  <p key={index}>{para}</p>
                ))}
              </div>
            </section>
          </div>

          <div className="flex flex-col gap-8">
            <section className="bg-white p-6 lg:p-8 rounded-[28px] shadow-sm border border-primary/5">
              <h2 className="text-2xl font-display font-bold text-foreground mb-6 flex items-center justify-between">
                Đánh giá ({product.reviewCount || 0})
                <Link
                  to={`/marketplaces/${product._id}/reviews`}
                  className="text-sm font-bold text-primary hover:underline"
                >
                  Xem tất cả
                </Link>
              </h2>
              {product.reviewCount === 0 ? (
                <div className="text-center py-12 bg-background rounded-2xl border border-dashed border-primary/10">
                  <span className="material-symbols-outlined text-5xl text-primary/20 mb-4">rate_review</span>
                  <p className="text-on-surface-variant font-bold uppercase tracking-widest text-[10px]">Chưa có đánh giá</p>
                </div>
              ) : (
                <div className="flex items-center gap-10 p-8 bg-background rounded-2xl border border-primary/5">
                  <div className="text-center">
                    <p className="text-6xl font-display font-black text-primary leading-none">{product.averageRating || 0}</p>
                    <div className="flex justify-center text-amber-500 mt-4 mb-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span key={star} className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: star <= Math.round(product.averageRating || 0) ? "'FILL' 1" : "" }}>
                          star
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex-1 space-y-2">
                    {[5, 4, 3, 2, 1].map(lvl => (
                      <div key={lvl} className="flex items-center gap-3">
                        <span className="text-[10px] font-bold text-on-surface-variant/50 w-2">{lvl}</span>
                        <div className="flex-1 h-1.5 bg-primary/5 rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full" style={{ width: lvl === 5 ? '80%' : '5%' }}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
          </div>
        </div>

        {relatedProducts.length > 0 && (
          <section className="mt-14">
            <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-2xl lg:text-3xl font-display font-bold text-foreground">Sản phẩm gợi ý</h2>
                <p className="mt-1 text-sm font-medium text-on-surface-variant">
                  Các sản phẩm khác trong danh mục {product.categoryId?.name || "này"}.
                </p>
              </div>
              <Link
                to={product.productType === "rent" ? "/cho-thue" : "/marketplaces"}
                className="inline-flex items-center gap-1 text-sm font-bold text-primary hover:underline"
              >
                Xem thêm
                <span className="material-symbols-outlined text-[16px]">east</span>
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {relatedProducts.map((item) => (
                <ProductSuggestionCard
                  key={item._id}
                  product={item}
                  formatPrice={formatPrice}
                  onOpen={(productId) => navigate(`/marketplaces/${productId}`)}
                />
              ))}
            </div>
          </section>
        )}
      </main>

      <Footer />

      {showReportModal && product ? (
        <ReportModal
          onClose={() => setShowReportModal(false)}
          reportedUserId={ownerId}
          postId={product._id}
          contextLabel={product.title}
        />
      ) : null}
    </div>
  );
};

export default ProductDetail;
