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
import rentalService from "../../services/rental.service";

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeImg, setActiveImg] = useState(0);
  const [showRentalModal, setShowRentalModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [purchaseQuantity, setPurchaseQuantity] = useState(1);

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
        setError("Khong the tai thong tin san pham.");
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  const totalDays =
    startDate && endDate
      ? Math.max(0, Math.ceil((new Date(endDate) - new Date(startDate)) / 86400000))
      : 0;
  const totalFee = totalDays * (product?.rentPricePerDay || 0);

  const getImageUrl = (img) => {
    if (!img) return "https://placehold.co/800x600?text=No+Image";
    if (img.startsWith("http")) return img;
    return `http://localhost:5000${img}`;
  };

  const formatPrice = (num) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(num || 0);

  const handleBuy = async () => {
    if (!user) return navigate("/dang-nhap");
    navigate(`/orders/create/${product._id}?quantity=${purchaseQuantity}`);
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

  const handleRentSubmit = async () => {
    if (!startDate || !endDate) return toast.error("Vui long chon ngay thue");
    setIsSubmitting(true);
    try {
      const res = await rentalService.createRentalRequest({
        productId: product._id,
        startDate,
        endDate,
      });
      if (res.success) {
        toast.success("Da gui yeu cau thue thanh cong");
        setShowRentalModal(false);
        navigate("/thue-muon");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Loi khi gui yeu cau thue");
    } finally {
      setIsSubmitting(false);
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
          <h2 className="text-xl font-bold">{error || "San pham khong ton tai"}</h2>
          <Link to="/" className="mt-4 px-6 py-2 bg-primary text-white rounded-full hover:opacity-90 transition-all">
            Quay lai trang chu
          </Link>
        </div>
      </div>
    );
  }

  const images = product.images?.length > 0 ? product.images : product.imageUrls?.length > 0 ? product.imageUrls : [];
  const displayPrice =
    product.productType === "rent" ? `${formatPrice(product.rentPricePerDay)}/ngay` : formatPrice(product.salePrice);
  const availableQuantity = Math.max(Number(product.quantity) || 0, 0);
  const sellerName = product.ownerId?.fullName || product.ownerId?.name || "Nguoi dung an";
  const sellerInitial = sellerName.charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-[#F5F5F7] flex flex-col font-sans">
      <Navbar />

      <main className="max-w-[1200px] mx-auto px-4 md:px-10 pt-28 pb-20 w-full flex-grow">
        <div className="flex items-center gap-2 text-sm text-on-surface-variant mb-8 bg-white/60 backdrop-blur-md px-4 py-2 rounded-full w-fit shadow-sm border border-surface-variant/20">
          <Link to="/" className="hover:text-primary transition-colors flex items-center">
            <span className="material-symbols-outlined text-[16px] mr-1">home</span>
            Trang chu
          </Link>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <Link to={product.productType === "rent" ? "/cho-thue" : "/marketplace"} className="hover:text-primary transition-colors">
            {product.productType === "rent" ? "Thue do" : "Mua sam"}
          </Link>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <span className="text-on-surface font-semibold truncate max-w-[200px]">{product.title}</span>
        </div>

        <div className="flex flex-col lg:flex-row gap-10 items-start">
          <div className="w-full lg:w-3/5 flex flex-col gap-4">
            <div className="w-full bg-white rounded-3xl overflow-hidden aspect-[4/3] flex items-center justify-center p-2 shadow-sm border border-surface-variant/20 group relative">
              {images.length > 0 && images[activeImg] ? (
                <img alt={product.title} className="w-full h-full object-contain rounded-2xl group-hover:scale-105 transition-transform duration-500" src={getImageUrl(images[activeImg])} />
              ) : (
                <div className="flex flex-col items-center justify-center gap-3 text-on-surface-variant">
                  <span className="material-symbols-outlined text-6xl opacity-30">image</span>
                  <p className="text-sm opacity-50">Chua co anh san pham</p>
                </div>
              )}
              <span className={`absolute top-5 left-5 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest backdrop-blur-md shadow-sm ${product.productType === "rent" ? "bg-primary/90 text-white" : "bg-white/90 text-primary border border-surface-variant/20"}`}>
                {product.productType === "rent" ? "Cho thue" : "Dang ban"}
              </span>
            </div>

            {images.length > 1 ? (
              <div className="flex gap-4 overflow-x-auto pb-2 custom-scrollbar">
                {images.map((img, idx) => (
                  <button
                    key={`${img}-${idx}`}
                    onClick={() => setActiveImg(idx)}
                    className={`flex-shrink-0 w-24 h-24 rounded-2xl overflow-hidden border-2 transition-all ${activeImg === idx ? "border-primary shadow-md scale-105" : "border-transparent hover:border-primary/50 bg-white"}`}
                  >
                    <img src={getImageUrl(img)} alt="" className="w-full h-full object-cover p-1 rounded-2xl" />
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <div className="w-full lg:w-2/5 sticky top-28 flex flex-col gap-6 bg-white p-8 rounded-3xl shadow-apple border border-surface-variant/20">
            <div>
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <span className="px-3 py-1 rounded-full bg-secondary/10 text-secondary text-xs font-bold uppercase tracking-wider">
                  {product.categoryId?.name || "Danh muc"}
                </span>
                <span className="px-3 py-1 rounded-full bg-surface-container text-on-surface-variant text-xs font-semibold">
                  {product.conditionStatus === "new"
                    ? "Moi"
                    : product.conditionStatus === "like_new"
                      ? "Nhu moi"
                      : product.conditionStatus === "good"
                        ? "Da dung - Con tot"
                        : "Da dung - Co loi nho"}
                </span>
              </div>
              <h1 className="text-3xl font-extrabold text-on-surface leading-tight mb-2">{product.title}</h1>
              <div className="flex items-baseline gap-2 mt-4">
                <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary-fixed">
                  {displayPrice}
                </span>
              </div>
              {product.productType === "sale" ? (
                <p className="mt-3 text-sm font-semibold text-on-surface-variant">
                  So luong con lai: <span className="text-on-surface">{availableQuantity}</span>
                </p>
              ) : null}
              {product.productType === "rent" && product.depositAmount > 0 ? (
                <p className="text-sm text-on-surface-variant mt-2 flex items-center gap-1 bg-surface-container-low w-fit px-3 py-1 rounded-full">
                  <span className="material-symbols-outlined text-[16px] text-tertiary">lock</span>
                  Tien coc: <span className="font-bold text-on-surface ml-1">{formatPrice(product.depositAmount)}</span>
                </p>
              ) : null}
            </div>

            <div className="flex items-center gap-2 text-on-surface-variant text-sm py-3 border-y border-surface-variant/20">
              <div className="w-8 h-8 rounded-full bg-surface-container-low flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px] text-primary">location_on</span>
              </div>
              <span className="font-medium">{product.location}</span>
            </div>

            <div className="flex flex-col gap-3 mt-2">
              {product.productType === "sale" && product.postStatus !== "closed" ? (
                <div className="rounded-2xl border border-surface-variant/30 bg-surface-container-lowest p-4">
                  <label className="mb-2 block text-sm font-bold text-on-surface">So luong mua</label>
                  <input
                    type="number"
                    min="1"
                    max={Math.max(availableQuantity, 1)}
                    value={purchaseQuantity}
                    onChange={(event) => {
                      const nextValue = Number(event.target.value) || 1;
                      setPurchaseQuantity(Math.min(Math.max(nextValue, 1), Math.max(availableQuantity, 1)));
                    }}
                    className="w-full rounded-2xl border border-surface-variant/50 bg-white px-4 py-3 text-base outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                  <p className="mt-2 text-xs text-on-surface-variant">Ban khong the mua nhieu hon so luong hien co.</p>
                </div>
              ) : null}

              {product.postStatus === "closed" ? (
                <button disabled className="w-full py-4 rounded-2xl bg-surface-container text-on-surface-variant font-bold shadow-none cursor-not-allowed">
                  {product.productType === "sale" ? "San pham da het hang" : "San pham dang duoc thue"}
                </button>
              ) : product.productType === "sale" ? (
                <>
                  <button onClick={handleBuy} disabled={isSubmitting} className="w-full py-4 rounded-2xl bg-gradient-to-r from-primary to-primary-fixed text-white font-bold hover:shadow-lg hover:shadow-primary/30 transition-all active:scale-[0.98]">
                    {isSubmitting ? "Dang xu ly..." : "Mua ngay"}
                  </button>
                  <button onClick={handleAddToCart} className="w-full py-4 rounded-2xl bg-white text-primary border-2 border-primary/20 font-bold hover:border-primary hover:bg-primary/5 transition-all active:scale-[0.98]">
                    Them vao gio hang
                  </button>
                </>
              ) : (
                <button onClick={() => (user ? setShowRentalModal(true) : navigate("/dang-nhap"))} className="w-full py-4 rounded-2xl bg-gradient-to-r from-primary to-primary-fixed text-white font-bold hover:shadow-lg hover:shadow-primary/30 transition-all active:scale-[0.98]">
                  Gui yeu cau thue
                </button>
              )}

              <button onClick={handleChat} className="w-full py-4 rounded-2xl bg-white text-primary border-2 border-primary/20 font-bold hover:border-primary hover:bg-primary/5 transition-all active:scale-[0.98]">
                Chat voi nguoi ban
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-surface-container-lowest border border-surface-variant/30 mt-4">
              <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-3">Nguoi dang</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {product.ownerId?.avatarUrl ? (
                    <img src={product.ownerId.avatarUrl} alt={sellerName} className="w-12 h-12 rounded-full object-cover" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-secondary to-tertiary text-white flex items-center justify-center font-bold text-lg shadow-sm">
                      {sellerInitial}
                    </div>
                  )}
                  <div>
                    <p className="font-bold text-on-surface text-base leading-none">{sellerName}</p>
                    <div className="flex items-center gap-2 text-xs text-on-surface-variant mt-1.5 font-medium">
                      <span className="flex items-center gap-0.5 text-orange-500 bg-orange-50 px-1.5 py-0.5 rounded-md">
                        <span className="material-symbols-outlined text-[13px]">star</span>
                        {product.ownerId?.averageRating || "0.0"}
                      </span>
                      <span className="flex items-center gap-0.5 text-primary bg-primary/10 px-1.5 py-0.5 rounded-md">
                        <span className="material-symbols-outlined text-[13px]">verified_user</span>
                        Uy tin: {product.ownerId?.reputationScore || 100}
                      </span>
                    </div>
                  </div>
                </div>
                <span className="material-symbols-outlined text-on-surface-variant hover:text-primary cursor-pointer transition-colors" title="Xem ho so">
                  chevron_right
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-on-surface-variant font-medium mt-2">
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px] text-green-500">gpp_good</span>
                Bao ve nguoi mua
              </span>
              <button onClick={() => (user ? setShowReportModal(true) : navigate("/dang-nhap"))} className="text-error hover:underline flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">flag</span>
                Bao cao
              </button>
            </div>
          </div>
        </div>

        <div className="mt-16 max-w-[1200px] flex flex-col lg:flex-row gap-10">
          <div className="w-full lg:w-3/5 bg-white p-8 rounded-3xl shadow-sm border border-surface-variant/20">
            <h2 className="text-2xl font-bold text-on-surface mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-3xl">description</span>
              Mo ta chi tiet
            </h2>
            <div className="text-on-surface-variant leading-relaxed space-y-4 text-base">
              {String(product.description || "").split("\n").map((para, index) => (
                <p key={index}>{para}</p>
              ))}
            </div>
          </div>
          <div className="w-full lg:w-2/5 bg-white p-8 rounded-3xl shadow-sm border border-surface-variant/20 h-fit">
            <h2 className="text-2xl font-bold text-on-surface mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary text-3xl">reviews</span>
              Danh gia ({product.reviewCount || 0})
            </h2>
            {product.reviewCount === 0 ? (
              <div className="text-center py-10 bg-surface-container-lowest rounded-2xl">
                <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-2">sentiment_dissatisfied</span>
                <p className="text-on-surface-variant">Chua co danh gia nao cho san pham nay.</p>
              </div>
            ) : (
              <div className="text-center py-10 bg-surface-container-lowest rounded-2xl">
                <span className="text-5xl font-black text-on-surface">{product.averageRating}</span>
                <div className="flex justify-center text-orange-500 mt-2 mb-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span key={star} className="material-symbols-outlined">
                      {star <= Math.round(product.averageRating) ? "star" : "star_border"}
                    </span>
                  ))}
                </div>
                <p className="text-sm text-on-surface-variant">Dua tren {product.reviewCount} luot danh gia</p>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />

      {showReportModal && product ? (
        <ReportModal
          onClose={() => setShowReportModal(false)}
          reportedUserId={product.ownerId?._id}
          postId={product._id}
          contextLabel={product.title}
        />
      ) : null}

      {showRentalModal ? (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-3xl p-8 shadow-2xl w-full max-w-md animate-scale-up">
            <h3 className="font-extrabold text-on-surface text-2xl mb-2">Yeu cau thue</h3>
            <p className="text-sm text-on-surface-variant mb-6 pb-4 border-b border-surface-variant/30">{product.title}</p>

            <div className="grid grid-cols-2 gap-5 mb-6">
              <div>
                <label className="block text-sm font-bold text-on-surface mb-2">Tu ngay</label>
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full px-4 py-3 border border-surface-variant/50 rounded-2xl text-sm bg-surface-container-lowest focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all" />
              </div>
              <div>
                <label className="block text-sm font-bold text-on-surface mb-2">Den ngay</label>
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full px-4 py-3 border border-surface-variant/50 rounded-2xl text-sm bg-surface-container-lowest focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all" />
              </div>
            </div>

            {totalDays > 0 ? (
              <div className="bg-surface-container-low rounded-2xl p-5 mb-6 space-y-2.5">
                <div className="flex justify-between text-on-surface-variant text-sm"><span>So ngay thue</span><span className="font-bold text-on-surface">{totalDays} ngay</span></div>
                <div className="flex justify-between text-on-surface-variant text-sm"><span>Tien thue</span><span className="font-bold text-on-surface">{formatPrice(totalFee)}</span></div>
                {product.depositAmount > 0 ? (
                  <div className="flex justify-between text-on-surface-variant text-sm"><span>Tien coc</span><span className="font-bold text-on-surface">{formatPrice(product.depositAmount)}</span></div>
                ) : null}
                <div className="flex justify-between font-black text-on-surface pt-3 mt-1 border-t border-surface-variant/30 text-lg">
                  <span>Tong thanh toan</span>
                  <span className="text-primary">{formatPrice(totalFee + (product.depositAmount || 0))}</span>
                </div>
              </div>
            ) : null}

            <div className="flex gap-4">
              <button onClick={() => setShowRentalModal(false)} disabled={isSubmitting} className="flex-1 py-3.5 border-2 border-surface-variant/30 rounded-full text-base font-bold hover:bg-surface-container transition-all">
                Huy
              </button>
              <button className="flex-1 py-3.5 bg-gradient-to-r from-primary to-primary-fixed text-white rounded-full text-base font-bold hover:shadow-lg hover:shadow-primary/30 transition-all active:scale-95 disabled:opacity-50" onClick={handleRentSubmit} disabled={isSubmitting}>
                {isSubmitting ? "Dang gui..." : "Gui yeu cau"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default ProductDetail;
