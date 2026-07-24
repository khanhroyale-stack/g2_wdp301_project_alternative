import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Home,
  ImageOff,
  MapPin,
  MessageCircle,
  Minus,
  Package,
  Plus,
  ShieldCheck,
  Star,
  Flag,
} from "lucide-react";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import ReportModal from "../../components/ReportModal";
import { useAuth } from "../../context/AuthContext";
import cartService from "../../services/cart.service";
import chatService from "../../services/chat.service";
import productService from "../../services/product.service";
import reviewService from "../../services/review.service";

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
      className="group et-card et-card-hover overflow-hidden text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:scale-[0.99]"
    >
      <div className="aspect-[4/3] overflow-hidden bg-surface-secondary m-3 mb-0 rounded-image">
        <img
          src={product.thumbnailUrl || product.images?.[0] || "https://placehold.co/480x480?text=EcoTrade"}
          alt={product.title}
          className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
        />
      </div>
      <div className="p-4">
        <div className="mb-2 flex items-center gap-2">
          <span
            className={`et-badge ${
              product.productType === "rent" ? "bg-secondary text-white" : "bg-primary text-white"
            }`}
          >
            {product.productType === "rent" ? "Thuê" : "Bán"}
          </span>
          <span className="truncate text-[11px] font-semibold uppercase tracking-wider text-muted">
            {product.location?.split(",")[0] || "Hòa Lạc"}
          </span>
        </div>
        <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-bold leading-5 text-foreground transition-colors duration-200 group-hover:text-primary">
          {product.title}
        </h3>
        <p className="mt-3 text-lg font-extrabold text-primary">{price}</p>
      </div>
    </button>
  );
};

function ProductDetailSkeleton() {
  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 md:px-10 pt-24 pb-24 w-full flex-grow">
        <div className="mb-8 h-10 w-64 animate-pulse rounded-pill bg-surface-secondary" />
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)]">
          <div className="space-y-4">
            <div className="aspect-[4/3] animate-pulse rounded-card bg-surface-secondary" />
            <div className="flex gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-20 w-20 animate-pulse rounded-image bg-surface-secondary" />
              ))}
            </div>
          </div>
          <div className="rounded-card border border-border bg-surface p-6 shadow-card space-y-5">
            <div className="h-6 w-40 animate-pulse rounded-btn bg-surface-secondary" />
            <div className="h-10 w-full animate-pulse rounded-btn bg-surface-secondary" />
            <div className="h-24 w-full animate-pulse rounded-field bg-surface-secondary" />
            <div className="h-12 w-full animate-pulse rounded-btn bg-surface-secondary" />
            <div className="h-12 w-full animate-pulse rounded-btn bg-surface-secondary" />
            <div className="h-20 w-full animate-pulse rounded-card bg-surface-secondary" />
          </div>
        </div>
        <div className="mt-14 grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="h-64 animate-pulse rounded-card bg-surface-secondary" />
          <div className="h-64 animate-pulse rounded-card bg-surface-secondary" />
        </div>
      </main>
      <Footer />
    </div>
  );
}

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
  const [reviews, setReviews] = useState([]);
  const [reviewStats, setReviewStats] = useState({ averageRating: 0, count: 0 });

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
    if (!id) return;
    const fetchReviews = async () => {
      try {
        const res = await reviewService.getPostReviews(id);
        if (res.success) {
          setReviews(res.data || []);
          setReviewStats({ averageRating: res.averageRating || 0, count: res.count || 0 });
        }
      } catch {
        setReviews([]);
      }
    };

    fetchReviews();
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
    return <ProductDetailSkeleton />;
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-background flex flex-col font-sans">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center pt-20 px-4">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-card bg-danger-soft">
            <ImageOff className="h-8 w-8 text-danger" />
          </div>
          <h2 className="text-xl font-extrabold text-foreground">{error || "Sản phẩm không tồn tại"}</h2>
          <Link
            to="/"
            className="et-btn-primary mt-6 hover:-translate-y-[3px]"
          >
            Quay lại trang chủ
          </Link>
        </div>
        <Footer />
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

  const ctaPrimary =
    "w-full py-4 rounded-btn bg-primary text-white text-sm font-bold transition-all duration-200 hover:bg-primary-hover hover:-translate-y-[3px] hover:shadow-card-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 disabled:translate-y-0";
  const ctaSecondary =
    "w-full py-4 rounded-btn bg-surface text-primary border border-border text-sm font-bold transition-all duration-200 hover:bg-surface-secondary hover:border-primary/30 hover:-translate-y-[3px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 disabled:translate-y-0";
  const ctaRent =
    "w-full py-4 rounded-btn bg-secondary text-white text-sm font-bold transition-all duration-200 hover:brightness-95 hover:-translate-y-[3px] hover:shadow-card-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 disabled:translate-y-0";

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans selection:bg-primary/15">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 md:px-10 pt-24 pb-24 w-full flex-grow">
        {/* Breadcrumb */}
        <nav
          aria-label="Breadcrumb"
          className="mb-8 inline-flex max-w-full items-center gap-2 rounded-pill border border-border bg-surface px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.14em] text-muted shadow-card"
        >
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 transition-colors duration-200 hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <Home className="h-3.5 w-3.5" />
            Trang chủ
          </Link>
          <ChevronRight className="h-3 w-3 opacity-40" />
          <Link
            to={product.productType === "rent" ? "/cho-thue" : "/marketplaces"}
            className="transition-colors duration-200 hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            {product.productType === "rent" ? "Thuê đồ" : "Mua sắm"}
          </Link>
          <ChevronRight className="h-3 w-3 opacity-40" />
          <span className="truncate max-w-[200px] text-primary">{product.title}</span>
        </nav>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)] lg:items-start">
          {/* Image Gallery */}
          <div className="flex flex-col gap-5">
            <div className="group relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-card border border-border bg-surface p-4 shadow-card">
              {images.length > 0 && images[activeImg] ? (
                <img
                  alt={product.title}
                  className="h-full w-full rounded-image object-contain transition-transform duration-200 group-hover:scale-[1.02]"
                  src={getImageUrl(images[activeImg])}
                />
              ) : (
                <div className="flex flex-col items-center justify-center gap-3 text-muted">
                  <ImageOff className="h-14 w-14" />
                  <p className="text-xs font-bold uppercase tracking-wider">Chưa có ảnh</p>
                </div>
              )}
              <div className="absolute top-5 left-5 flex gap-2">
                <span
                  className={`et-badge shadow-sm ${
                    product.productType === "rent" ? "bg-secondary text-white" : "bg-primary text-white"
                  }`}
                >
                  {product.productType === "rent" ? "Cho thuê" : "Đang bán"}
                </span>
              </div>
              {images.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => setActiveImg((prev) => (prev - 1 + images.length) % images.length)}
                    className="absolute left-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-btn border border-border bg-surface/90 text-primary shadow-card backdrop-blur-md transition-all duration-200 hover:-translate-y-[calc(50%+3px)] hover:bg-primary hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:scale-[0.98] opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100"
                    aria-label="Ảnh trước"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveImg((prev) => (prev + 1) % images.length)}
                    className="absolute right-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-btn border border-border bg-surface/90 text-primary shadow-card backdrop-blur-md transition-all duration-200 hover:-translate-y-[calc(50%+3px)] hover:bg-primary hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:scale-[0.98] opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100"
                    aria-label="Ảnh tiếp"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                  <div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 gap-1.5 rounded-pill bg-foreground/20 p-1.5 backdrop-blur-md">
                    {images.map((_, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setActiveImg(idx)}
                        className={`h-1.5 rounded-pill transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${
                          activeImg === idx ? "w-6 bg-white" : "w-1.5 bg-white/50 hover:bg-white"
                        }`}
                        aria-label={`Ảnh ${idx + 1}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>

            {images.length > 1 ? (
              <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
                {images.map((img, idx) => (
                  <button
                    key={`${img}-${idx}`}
                    type="button"
                    onClick={() => setActiveImg(idx)}
                    className={`h-20 w-20 flex-shrink-0 overflow-hidden rounded-image border-2 transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:scale-[0.98] ${
                      activeImg === idx
                        ? "border-primary shadow-card"
                        : "border-transparent opacity-60 hover:opacity-100 hover:border-primary/30 bg-surface"
                    }`}
                  >
                    <img src={getImageUrl(img)} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          {/* Product Info Panel */}
          <div className="flex w-full flex-col gap-5 rounded-card border border-border bg-surface p-6 shadow-card lg:sticky lg:top-24 lg:p-8">
            <div>
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <span className="et-badge border border-primary/15 bg-primary/10 text-primary">
                  {product.categoryId?.name || "Sản phẩm"}
                </span>
                <span className="et-badge border border-secondary/20 bg-success-soft text-success">
                  {product.conditionStatus === "new" ? "Mới 100%" : "Đã qua sử dụng"}
                </span>
              </div>
              <h1 className="mb-5 text-3xl font-extrabold leading-tight tracking-tight text-foreground lg:text-4xl">
                {product.title}
              </h1>

              <div className="flex flex-col gap-1 rounded-field border border-border bg-surface-secondary p-5">
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted">
                  {product.productType === "rent" ? "Giá thuê mỗi ngày" : "Giá niêm yết"}
                </p>
                <p className="text-4xl font-extrabold text-primary">{displayPrice}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 rounded-field border border-border bg-surface p-4">
              <div className="flex flex-col gap-1">
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted">Khu vực</p>
                <div className="flex items-center gap-1.5 text-sm font-bold text-foreground">
                  <MapPin className="h-4 w-4 text-primary" />
                  {product.location?.split(",")[0] || "Hòa Lạc"}
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted">Tình trạng</p>
                <div className="flex items-center gap-1.5 text-sm font-bold text-foreground">
                  <Package className="h-4 w-4 text-secondary" />
                  {availableQuantity > 0 ? "Còn hàng" : "Hết hàng"}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              {isSaleProduct && isPubliclyAvailable ? (
                <div className="flex flex-col gap-3 rounded-field border border-border bg-surface-secondary p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Số lượng
                    </span>
                    <span className="et-badge bg-primary/10 text-primary">
                      Còn {availableQuantity} sản phẩm
                    </span>
                  </div>
                  <div className="flex w-full items-center gap-4">
                    <button
                      type="button"
                      onClick={() => setPurchaseQuantity((q) => Math.max(1, q - 1))}
                      className="flex h-9 w-9 items-center justify-center rounded-btn border border-border bg-surface font-bold text-foreground transition-all duration-200 hover:bg-primary hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:scale-[0.98]"
                      aria-label="Giảm số lượng"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="flex-1 text-center text-lg font-extrabold">{purchaseQuantity}</span>
                    <button
                      type="button"
                      onClick={() => setPurchaseQuantity((q) => Math.min(availableQuantity, q + 1))}
                      className="flex h-9 w-9 items-center justify-center rounded-btn border border-border bg-surface font-bold text-foreground transition-all duration-200 hover:bg-primary hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:scale-[0.98]"
                      aria-label="Tăng số lượng"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ) : null}

              {!isPubliclyAvailable || availableQuantity <= 0 ? (
                <button
                  type="button"
                  disabled
                  className="w-full cursor-not-allowed rounded-btn bg-surface-secondary py-4 text-sm font-bold uppercase tracking-wider text-muted opacity-60"
                >
                  Hiện không khả dụng
                </button>
              ) : isSaleProduct ? (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <button type="button" disabled={!canBuyProduct} onClick={handleBuy} className={ctaPrimary}>
                    Mua ngay
                  </button>
                  <button
                    type="button"
                    disabled={!canBuyProduct}
                    onClick={handleAddToCart}
                    className={ctaSecondary}
                  >
                    Giỏ hàng
                  </button>
                  {isRentProduct ? (
                    <button
                      type="button"
                      disabled={!canRentProduct}
                      onClick={() => (user ? navigate(`/thue/${product._id}`) : navigate("/dang-nhap"))}
                      className={`sm:col-span-2 ${ctaRent}`}
                    >
                      Tiến hành thuê
                    </button>
                  ) : null}
                </div>
              ) : (
                <button
                  type="button"
                  disabled={!canRentProduct}
                  onClick={() => (user ? navigate(`/thue/${product._id}`) : navigate("/dang-nhap"))}
                  className={ctaRent}
                >
                  Tiến hành thuê
                </button>
              )}

              {(!user || !isOwnProduct) && (
                <button
                  type="button"
                  onClick={handleChat}
                  className="flex w-full items-center justify-center gap-2 rounded-btn bg-surface-secondary py-4 text-sm font-bold text-primary transition-all duration-200 hover:-translate-y-[3px] hover:bg-primary/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:scale-[0.98]"
                >
                  <MessageCircle className="h-5 w-5" />
                  Liên hệ người đăng
                </button>
              )}
            </div>

            {/* Seller Mini Card */}
            <div className="group relative overflow-hidden rounded-card border border-border bg-surface-secondary p-5 transition-all duration-200 hover:-translate-y-[3px] hover:border-primary/20 hover:shadow-card">
              <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    {product.ownerId?.avatarUrl ? (
                      <img
                        src={product.ownerId.avatarUrl}
                        alt={sellerName}
                        className="h-12 w-12 rounded-full border-2 border-surface object-cover shadow-card"
                      />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-surface bg-primary text-lg font-bold text-white shadow-card">
                        {sellerInitial}
                      </div>
                    )}
                    <div className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full border-2 border-surface bg-success">
                      <Check className="h-3 w-3 text-white" strokeWidth={3} />
                    </div>
                  </div>
                  <div>
                    <p className="mb-1 text-base font-bold leading-none text-foreground">{sellerName}</p>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
                      Uy tín {product.ownerId?.reputationScore || 100}
                    </span>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-primary" />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-field border border-primary/15 bg-primary/5 p-4">
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-primary">
                <ShieldCheck className="h-4 w-4" />
                Giao dịch được bảo vệ
              </div>
              {!isOwnProduct ? (
                <button
                  type="button"
                  onClick={openReportModal}
                  className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-danger/70 transition-colors duration-200 hover:text-danger focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-danger"
                >
                  <Flag className="h-3.5 w-3.5" />
                  Báo cáo đơn
                </button>
              ) : null}
            </div>
          </div>
        </div>

        {/* Detailed Description */}
        <div className="mt-14 grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
          <div className="flex flex-col gap-8">
            <section className="rounded-card border border-border bg-surface p-6 shadow-card lg:p-8">
              <h2 className="mb-6 flex items-center gap-3 text-2xl font-extrabold text-foreground">
                <span className="h-7 w-1 rounded-pill bg-primary" />
                Mô tả sản phẩm
              </h2>
              <div className="space-y-4 text-base font-medium leading-relaxed text-muted-foreground lg:text-lg">
                {String(product.description || "").split("\n").map((para, index) => (
                  <p key={index}>{para}</p>
                ))}
              </div>
            </section>
          </div>

          <div className="flex flex-col gap-8">
            <section className="rounded-card border border-border bg-surface p-6 shadow-card lg:p-8">
              <h2 className="mb-6 flex items-center justify-between text-2xl font-extrabold text-foreground">
                <span>Đánh giá ({reviewStats.count || 0})</span>
                {reviewStats.count > 0 ? (
                  <Link
                    to={`/marketplaces/${product._id}/reviews`}
                    className="text-sm font-bold text-primary transition-colors duration-200 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  >
                    Xem tất cả
                  </Link>
                ) : null}
              </h2>
              {reviewStats.count === 0 ? (
                <div className="rounded-field border border-dashed border-border bg-surface-secondary py-12 text-center">
                  <Star className="mx-auto mb-3 h-10 w-10 text-primary/20" />
                  <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Chưa có đánh giá
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-5">
                  <div className="flex items-center gap-8 rounded-field border border-border bg-surface-secondary p-6">
                    <div className="text-center">
                      <p className="text-5xl font-extrabold leading-none text-primary">
                        {reviewStats.averageRating || 0}
                      </p>
                      <div className="mt-3 mb-2 flex justify-center gap-0.5 text-warning">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className="h-4 w-4"
                            fill={star <= Math.round(reviewStats.averageRating || 0) ? "currentColor" : "none"}
                          />
                        ))}
                      </div>
                      <p className="text-[11px] font-bold uppercase tracking-wider text-muted">
                        {reviewStats.count} đánh giá
                      </p>
                    </div>
                    <div className="flex-1 space-y-2">
                      {[5, 4, 3, 2, 1].map((lvl) => {
                        const lvlCount = reviews.filter((r) => r.rating === lvl).length;
                        const pct = reviewStats.count > 0 ? (lvlCount / reviewStats.count) * 100 : 0;
                        return (
                          <div key={lvl} className="flex items-center gap-3">
                            <span className="w-2 text-[11px] font-bold text-muted">{lvl}</span>
                            <div className="h-1.5 flex-1 overflow-hidden rounded-pill bg-primary/10">
                              <div className="h-full rounded-pill bg-primary" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="w-4 text-right text-[11px] font-bold text-muted">{lvlCount}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    {reviews.slice(0, 3).map((review) => (
                      <div
                        key={review._id}
                        className="rounded-field border border-border bg-surface-secondary p-4"
                      >
                        <div className="mb-3 flex items-center gap-3">
                          {review.reviewerId?.avatarUrl ? (
                            <img
                              src={review.reviewerId.avatarUrl}
                              alt={review.reviewerId.fullName}
                              className="h-10 w-10 rounded-full border-2 border-surface object-cover shadow-card"
                            />
                          ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-surface bg-primary text-sm font-bold text-white shadow-card">
                              {review.reviewerId?.fullName?.charAt(0)?.toUpperCase() || "U"}
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-bold text-foreground">
                              {review.reviewerId?.fullName || "Người dùng"}
                            </p>
                            <div className="flex items-center gap-2">
                              <div className="flex gap-0.5 text-warning">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star
                                    key={star}
                                    className="h-3 w-3"
                                    fill={star <= review.rating ? "currentColor" : "none"}
                                  />
                                ))}
                              </div>
                              <span className="text-[11px] text-muted">
                                {new Date(review.createdAt).toLocaleDateString("vi-VN")}
                              </span>
                            </div>
                          </div>
                        </div>
                        {review.comment ? (
                          <p className="text-sm font-medium leading-relaxed text-muted-foreground">
                            {review.comment}
                          </p>
                        ) : null}
                      </div>
                    ))}
                    {reviewStats.count > 3 ? (
                      <Link
                        to={`/marketplaces/${product._id}/reviews`}
                        className="py-2 text-center text-sm font-bold text-primary transition-colors duration-200 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                      >
                        Xem thêm {reviewStats.count - 3} đánh giá
                      </Link>
                    ) : null}
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
                <h2 className="text-2xl font-extrabold text-foreground lg:text-3xl">Sản phẩm gợi ý</h2>
                <p className="mt-1 text-sm font-medium text-muted-foreground">
                  Các sản phẩm khác trong danh mục {product.categoryId?.name || "này"}.
                </p>
              </div>
              <Link
                to={product.productType === "rent" ? "/cho-thue" : "/marketplaces"}
                className="inline-flex items-center gap-1 text-sm font-bold text-primary transition-all duration-200 hover:gap-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                Xem thêm
                <ChevronRight className="h-4 w-4" />
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
