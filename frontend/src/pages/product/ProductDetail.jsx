import { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import ReportModal from "../../components/ReportModal";
import { useAuth } from "../../context/AuthContext";
import productService from "../../services/product.service";
import rentalService from "../../services/rental.service";
import orderService from "../../services/order.service";
import chatService from "../../services/chat.service";
import toast from "react-hot-toast";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { formatPrice } from "../../lib/utils";

const ProductDetail = () => {
    const { id } = useParams();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [activeImg, setActiveImg] = useState(0);
    const [showRentalModal, setShowRentalModal] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);
    const [showOrderModal, setShowOrderModal] = useState(false);
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Order form state
    const [orderPreview, setOrderPreview] = useState(null);
    const [orderForm, setOrderForm] = useState({
        recipientName: "",
        buyerPhone: "",
        buyerAddress: "",
        note: "",
    });
    const [orderLoading, setOrderLoading] = useState(false);

    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchProduct = async () => {
            setLoading(true);
            try {
                const res = await productService.getProduct(id);
                if (res.success) {
                    setProduct(res.data);
                } else {
                    setError(res.message);
                }
            } catch (err) {
                setError("Không thể tải thông tin sản phẩm.");
            } finally {
                setLoading(false);
            }
        };
        fetchProduct();
    }, [id]);

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
                    <Link to="/" className="mt-4 px-6 py-2 bg-primary text-white rounded-full hover:opacity-90 transition-all">Quay lại trang chủ</Link>
                </div>
            </div>
        );
    }

    const totalDays = startDate && endDate
        ? Math.max(0, Math.ceil((new Date(endDate) - new Date(startDate)) / 86400000))
        : 0;
    const totalFee = totalDays * (product.rentPricePerDay || 0);

    const getImageUrl = (img) => {
        if (!img) return "https://placehold.co/800x600?text=No+Image";
        if (img.startsWith("http")) return img;
        return `http://localhost:5000${img}`;
    };

    const formatPrice = (num) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num || 0);

    const images = product.imageUrls?.length > 0 ? product.imageUrls : [];
    const displayPrice = product.productType === "rent" ? `${formatPrice(product.rentPricePerDay)}/ngày` : formatPrice(product.salePrice);

    const sellerName = product.ownerId?.fullName || product.ownerId?.name || "Người dùng ẩn";
    const sellerInitial = sellerName.charAt(0).toUpperCase();

    const handleBuy = async () => {
        if (!user) return navigate("/dang-nhap");
        setShowOrderModal(true);
        setOrderLoading(true);
        try {
            const res = await orderService.getCheckoutPreview(id);
            if (res.success) {
                setOrderPreview(res.data);
                setOrderForm({
                    recipientName: res.data.buyer?.fullName || "",
                    buyerPhone: res.data.buyer?.phone || "",
                    buyerAddress: res.data.buyer?.address || "",
                    note: "",
                });
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Không thể tải thông tin sản phẩm");
            setShowOrderModal(false);
        } finally {
            setOrderLoading(false);
        }
    };

    const handleOrderSubmit = async (e) => {
        e.preventDefault();
        if (!orderForm.recipientName || !orderForm.buyerPhone || !orderForm.buyerAddress) {
            toast.error("Vui lòng điền đầy đủ thông tin");
            return;
        }
        setIsSubmitting(true);
        try {
            const res = await orderService.createOrder({ productId: id, ...orderForm });
            if (res.success) {
                toast.success("Đặt hàng thành công!");
                setShowOrderModal(false);
                // Refresh product data
                const productRes = await productService.getProduct(id);
                if (productRes.success) setProduct(productRes.data);
                navigate("/don-hang");
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Không thể tạo đơn hàng");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRentSubmit = async () => {
        if (!startDate || !endDate) return toast.error("Vui lòng chọn ngày thuê");
        setIsSubmitting(true);
        try {
            const res = await rentalService.createRentalRequest({
                productId: product._id,
                startDate,
                endDate
            });
            if (res.success) {
                toast.success("Đã gửi yêu cầu thuê thành công!");
                setShowRentalModal(false);
                navigate("/thue-muon");
            }
        } catch (err) {
            toast.error(err.response?.data?.message || "Lỗi khi gửi yêu cầu thuê");
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

    return (
        <div className="min-h-screen bg-[#F5F5F7] flex flex-col font-sans">
            <Navbar />

            <main className="max-w-[1200px] mx-auto px-4 md:px-10 pt-28 pb-20 w-full flex-grow">
                {/* Breadcrumb */}
                <div className="flex items-center gap-2 text-sm text-on-surface-variant mb-8 bg-white/60 backdrop-blur-md px-4 py-2 rounded-full w-fit shadow-sm border border-surface-variant/20">
                    <Link to="/" className="hover:text-primary transition-colors flex items-center"><span className="material-symbols-outlined text-[16px] mr-1">home</span>Trang chủ</Link>
                    <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                    <Link to={product.productType === "rent" ? "/cho-thue" : "/marketplace"} className="hover:text-primary transition-colors">
                        {product.productType === "rent" ? "Thuê đồ" : "Mua sắm"}
                    </Link>
                    <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                    <span className="text-on-surface font-semibold truncate max-w-[200px]">{product.title}</span>
                </div>

                <div className="flex flex-col lg:flex-row gap-10 items-start">
                    {/* Left: Images */}
                    <div className="w-full lg:w-3/5 flex flex-col gap-4">
                        <div className="w-full bg-white rounded-3xl overflow-hidden aspect-[4/3] flex items-center justify-center p-2 shadow-sm border border-surface-variant/20 group relative">
                            {images.length > 0 && images[activeImg] ? (
                                <img alt={product.title}
                                    className="w-full h-full object-contain rounded-2xl group-hover:scale-105 transition-transform duration-500"
                                    src={getImageUrl(images[activeImg])} />
                            ) : (
                                <div className="flex flex-col items-center justify-center gap-3 text-on-surface-variant">
                                    <span className="material-symbols-outlined text-6xl opacity-30">image</span>
                                    <p className="text-sm opacity-50">Chưa có ảnh sản phẩm</p>
                                </div>
                            )}
                            <span className={`absolute top-5 left-5 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest backdrop-blur-md shadow-sm ${product.productType === "rent" ? "bg-primary/90 text-white" : "bg-white/90 text-primary border border-surface-variant/20"
                                }`}>
                                {product.productType === "rent" ? "Cho thuê" : "Đang bán"}
                            </span>
                        </div>
                        {images.length > 1 && (
                            <div className="flex gap-4 overflow-x-auto pb-2 custom-scrollbar">
                                {images.map((img, idx) => (
                                    <button key={idx} onClick={() => setActiveImg(idx)}
                                        className={`flex-shrink-0 w-24 h-24 rounded-2xl overflow-hidden border-2 transition-all ${activeImg === idx ? "border-primary shadow-md scale-105" : "border-transparent hover:border-primary/50 bg-white"
                                            }`}>
                                        <img src={getImageUrl(img)} alt="" className="w-full h-full object-cover p-1 rounded-2xl" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Right: Info */}
                    <div className="w-full lg:w-2/5 sticky top-28 flex flex-col gap-6 bg-white p-8 rounded-3xl shadow-apple border border-surface-variant/20">
                        {/* Title & Price */}
                        <div>
                            <div className="flex items-center gap-2 mb-3 flex-wrap">
                                <span className="px-3 py-1 rounded-full bg-secondary/10 text-secondary text-xs font-bold uppercase tracking-wider">
                                    {product.categoryId?.name || "Danh mục"}
                                </span>
                                <span className="px-3 py-1 rounded-full bg-surface-container text-on-surface-variant text-xs font-semibold">
                                    {product.conditionStatus === 'new' ? 'Mới' : product.conditionStatus === 'like_new' ? 'Như mới' : product.conditionStatus === 'good' ? 'Đã dùng - Còn tốt' : 'Đã dùng - Có lỗi nhỏ'}
                                </span>
                            </div>
                            <h1 className="text-3xl font-extrabold text-on-surface leading-tight mb-2">{product.title}</h1>
                            <div className="flex items-baseline gap-2 mt-4">
                                <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary-fixed">{displayPrice}</span>
                            </div>
                            {product.productType === "rent" && product.depositAmount > 0 && (
                                <p className="text-sm text-on-surface-variant mt-2 flex items-center gap-1 bg-surface-container-low w-fit px-3 py-1 rounded-full">
                                    <span className="material-symbols-outlined text-[16px] text-tertiary">lock</span>
                                    Tiền cọc: <span className="font-bold text-on-surface ml-1">{formatPrice(product.depositAmount)}</span>
                                </p>
                            )}
                        </div>

                        {/* Location */}
                        <div className="flex items-center gap-2 text-on-surface-variant text-sm py-3 border-y border-surface-variant/20">
                            <div className="w-8 h-8 rounded-full bg-surface-container-low flex items-center justify-center">
                                <span className="material-symbols-outlined text-[18px] text-primary">location_on</span>
                            </div>
                            <span className="font-medium">{product.location}</span>
                        </div>

                        {/* Action buttons */}
                        <div className="flex flex-col gap-3 mt-2">
                            {product.postStatus === "closed" ? (
                                <button disabled
                                    className="w-full py-4 rounded-2xl bg-surface-container text-on-surface-variant font-bold shadow-none cursor-not-allowed">
                                    {product.productType === "sale" ? "Sản phẩm đã bán" : "Sản phẩm đang được thuê"}
                                </button>
                            ) : product.productType === "sale" ? (
                                <button
                                    onClick={handleBuy} disabled={isSubmitting}
                                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-primary to-primary-fixed text-white font-bold hover:shadow-lg hover:shadow-primary/30 transition-all active:scale-[0.98]">
                                    {isSubmitting ? "Đang xử lý..." : "Mua ngay"}
                                </button>
                            ) : (
                                <button
                                    onClick={() => user ? setShowRentalModal(true) : navigate("/dang-nhap")}
                                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-primary to-primary-fixed text-white font-bold hover:shadow-lg hover:shadow-primary/30 transition-all active:scale-[0.98]">
                                    Gửi yêu cầu thuê
                                </button>
                            )}
                            <button onClick={handleChat} className="w-full py-4 rounded-2xl bg-white text-primary border-2 border-primary/20 font-bold hover:border-primary hover:bg-primary/5 transition-all active:scale-[0.98]">
                                Chat với người bán
                            </button>
                        </div>

                        {/* Seller */}
                        <div className="p-4 rounded-2xl bg-surface-container-lowest border border-surface-variant/30 mt-4">
                            <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-3">Người đăng</p>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    {product.ownerId?.avatar ? (
                                        <img src={product.ownerId.avatar} alt={sellerName} className="w-12 h-12 rounded-full object-cover" />
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
                                                Uy tín: {product.ownerId?.reputationScore || 100}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <span className="material-symbols-outlined text-on-surface-variant hover:text-primary cursor-pointer transition-colors" title="Xem hồ sơ">chevron_right</span>
                            </div>
                        </div>

                        <div className="flex items-center justify-between text-xs text-on-surface-variant font-medium mt-2">
                            <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[16px] text-green-500">gpp_good</span>Bảo vệ người mua</span>
                            <button
                                onClick={() => user ? setShowReportModal(true) : navigate("/dang-nhap")}
                                className="text-error hover:underline flex items-center gap-1">
                                <span className="material-symbols-outlined text-[16px]">flag</span>
                                Báo cáo
                            </button>
                        </div>
                    </div>
                </div>

                {/* Description & Reviews */}
                <div className="mt-16 max-w-[1200px] flex flex-col lg:flex-row gap-10">
                    <div className="w-full lg:w-3/5 bg-white p-8 rounded-3xl shadow-sm border border-surface-variant/20">
                        <h2 className="text-2xl font-bold text-on-surface mb-6 flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary text-3xl">description</span>
                            Mô tả chi tiết
                        </h2>
                        <div className="text-on-surface-variant leading-relaxed space-y-4 text-base">
                            {product.description.split("\n").map((para, i) => <p key={i}>{para}</p>)}
                        </div>
                    </div>
                    <div className="w-full lg:w-2/5 bg-white p-8 rounded-3xl shadow-sm border border-surface-variant/20 h-fit">
                        <h2 className="text-2xl font-bold text-on-surface mb-6 flex items-center gap-2">
                            <span className="material-symbols-outlined text-secondary text-3xl">reviews</span>
                            Đánh giá ({product.reviewCount || 0})
                        </h2>
                        {product.reviewCount === 0 ? (
                            <div className="text-center py-10 bg-surface-container-lowest rounded-2xl">
                                <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-2">sentiment_dissatisfied</span>
                                <p className="text-on-surface-variant">Chưa có đánh giá nào cho sản phẩm này.</p>
                            </div>
                        ) : (
                            <div className="text-center py-10 bg-surface-container-lowest rounded-2xl">
                                <span className="text-5xl font-black text-on-surface">{product.averageRating}</span>
                                <div className="flex justify-center text-orange-500 mt-2 mb-2">
                                    {[1, 2, 3, 4, 5].map(i => (
                                        <span key={i} className="material-symbols-outlined">{i <= Math.round(product.averageRating) ? "star" : "star_border"}</span>
                                    ))}
                                </div>
                                <p className="text-sm text-on-surface-variant">Dựa trên {product.reviewCount} lượt đánh giá</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            <Footer />

            {/* Report Modal */}
            {showReportModal && product && (
                <ReportModal
                    onClose={() => setShowReportModal(false)}
                    reportedUserId={product.ownerId?._id}
                    postId={product._id}
                    contextLabel={product.title}
                />
            )}

            {/* Rental Modal */}
            {showRentalModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4">
                    <div className="bg-white rounded-3xl p-8 shadow-2xl w-full max-w-md animate-scale-up">
                        <h3 className="font-extrabold text-on-surface text-2xl mb-2">Yêu cầu thuê</h3>
                        <p className="text-sm text-on-surface-variant mb-6 pb-4 border-b border-surface-variant/30">{product.title}</p>

                        <div className="grid grid-cols-2 gap-5 mb-6">
                            <div>
                                <label className="block text-sm font-bold text-on-surface mb-2">Từ ngày</label>
                                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                                    className="w-full px-4 py-3 border border-surface-variant/50 rounded-2xl text-sm bg-surface-container-lowest focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-on-surface mb-2">Đến ngày</label>
                                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
                                    className="w-full px-4 py-3 border border-surface-variant/50 rounded-2xl text-sm bg-surface-container-lowest focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all" />
                            </div>
                        </div>

                        {totalDays > 0 && (
                            <div className="bg-surface-container-low rounded-2xl p-5 mb-6 space-y-2.5">
                                <div className="flex justify-between text-on-surface-variant text-sm">
                                    <span>Số ngày thuê</span><span className="font-bold text-on-surface">{totalDays} ngày</span>
                                </div>
                                <div className="flex justify-between text-on-surface-variant text-sm">
                                    <span>Tiền thuê</span><span className="font-bold text-on-surface">{formatPrice(totalFee)}</span>
                                </div>
                                {product.depositAmount > 0 && (
                                    <div className="flex justify-between text-on-surface-variant text-sm">
                                        <span>Tiền cọc</span><span className="font-bold text-on-surface">{formatPrice(product.depositAmount)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between font-black text-on-surface pt-3 mt-1 border-t border-surface-variant/30 text-lg">
                                    <span>Tổng thanh toán</span>
                                    <span className="text-primary">{formatPrice(totalFee + (product.depositAmount || 0))}</span>
                                </div>
                            </div>
                        )}

                        <div className="flex gap-4">
                            <button onClick={() => setShowRentalModal(false)} disabled={isSubmitting}
                                className="flex-1 py-3.5 border-2 border-surface-variant/30 rounded-full text-base font-bold hover:bg-surface-container transition-all">Hủy</button>
                            <button className="flex-1 py-3.5 bg-gradient-to-r from-primary to-primary-fixed text-white rounded-full text-base font-bold hover:shadow-lg hover:shadow-primary/30 transition-all disabled:opacity-50"
                                onClick={handleRentSubmit} disabled={isSubmitting}>
                                {isSubmitting ? "Đang gửi..." : "Gửi yêu cầu"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Order Modal */}
            {showOrderModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] px-4 py-8 overflow-y-auto">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl animate-scale-up">
                        <div className="p-8">
                            <div className="flex items-start justify-between gap-6 mb-6">
                                <div>
                                    <h3 className="font-extrabold text-2xl mb-1">Xác nhận Đơn hàng</h3>
                                    <p className="text-sm text-on-surface-variant">Vui lòng kiểm tra kỹ thông tin trước khi hoàn tất giao dịch.</p>
                                </div>
                                <button onClick={() => setShowOrderModal(false)} className="p-2 hover:bg-surface-container-low rounded-xl transition-all text-on-surface-variant">
                                    <span className="material-symbols-outlined text-2xl">close</span>
                                </button>
                            </div>

                            {orderLoading ? (
                                <div className="flex justify-center items-center py-10">
                                    <span className="material-symbols-outlined text-primary text-5xl animate-spin">refresh</span>
                                </div>
                            ) : orderPreview && (
                                <form onSubmit={handleOrderSubmit} className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_340px]">
                                    <div className="space-y-7">
                                        <div className="p-6 rounded-2xl border border-surface-variant/20 bg-surface-container-lowest">
                                            <h4 className="text-xl font-bold mb-4 flex items-center gap-2">
                                                <span className="material-symbols-outlined text-primary">map_pin</span>
                                                Thông tin nhận hàng
                                            </h4>
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="block text-sm font-bold mb-2">Họ và tên người nhận</label>
                                                    <Input value={orderForm.recipientName} onChange={(e) => setOrderForm({ ...orderForm, recipientName: e.target.value })} />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-bold mb-2">Số điện thoại</label>
                                                    <Input value={orderForm.buyerPhone} onChange={(e) => setOrderForm({ ...orderForm, buyerPhone: e.target.value })} />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-bold mb-2">Địa chỉ giao hàng</label>
                                                    <Textarea value={orderForm.buyerAddress} onChange={(e) => setOrderForm({ ...orderForm, buyerAddress: e.target.value })} className="min-h-[100px]" />
                                                </div>
                                                <div className="flex items-center gap-2 text-sm text-on-surface-variant">
                                                    <span className="material-symbols-outlined text-[18px]">info</span>
                                                    Vui lòng nhập chính xác để shipper dễ dàng tìm thấy bạn.
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-6 rounded-2xl border border-surface-variant/20 bg-surface-container-lowest">
                                            <h4 className="text-xl font-bold mb-4 flex items-center gap-2">
                                                <span className="material-symbols-outlined text-primary">inventory_2</span>
                                                Chi tiết sản phẩm
                                            </h4>
                                            <div className="flex gap-5">
                                                <div className="w-24 h-24 rounded-2xl bg-surface-variant/20 overflow-hidden flex-shrink-0">
                                                    {images.length > 0 ? (
                                                        <img src={getImageUrl(images[0])} alt={product.title} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="flex items-center justify-center h-full text-on-surface-variant">
                                                            <span className="material-symbols-outlined text-4xl">image</span>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex-1">
                                                    <h5 className="text-lg font-bold">{product.title}</h5>
                                                    <div className="flex gap-3 mt-2">
                                                        <Badge>{product.categoryId?.name || "Danh mục"}</Badge>
                                                        <Badge>{product.conditionStatus === 'new' ? 'Mới' : product.conditionStatus === 'like_new' ? 'Như mới' : product.conditionStatus === 'good' ? 'Đã dùng - Còn tốt' : 'Đã dùng - Có lỗi nhỏ'}</Badge>
                                                    </div>
                                                    <p className="text-xl font-black text-primary mt-4">{formatPrice(product.salePrice)}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-6 rounded-2xl border border-surface-variant/20 bg-surface-container-lowest">
                                            <label className="block text-sm font-bold mb-2">Ghi chú cho người bán (Không bắt buộc)</label>
                                            <Textarea
                                                value={orderForm.note}
                                                onChange={(e) => setOrderForm({ ...orderForm, note: e.target.value })}
                                                placeholder="Ví dụ: Giao hàng vào giờ hành chính, gọi trước khi đến..."
                                                className="min-h-[100px]"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-7">
                                        <div className="p-6 rounded-2xl border border-surface-variant/20 bg-surface-container-lowest">
                                            <h4 className="text-xl font-bold mb-4">Tóm tắt đơn hàng</h4>
                                            <div className="space-y-3 text-base">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-on-surface-variant">Tạm tính (1 sản phẩm)</span>
                                                    <span className="font-medium">{formatPrice(orderPreview.subtotal)}</span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-on-surface-variant">Phí vận chuyển</span>
                                                    <span className="font-medium">{formatPrice(orderPreview.shippingFee)}</span>
                                                </div>
                                            </div>
                                            <div className="border-t border-dashed border-surface-variant/30 pt-4 mt-4">
                                                <div className="flex items-end justify-between">
                                                    <div>
                                                        <p className="text-base font-bold">Tổng cộng</p>
                                                        <p className="text-xs text-on-surface-variant">(Đã bao gồm VAT)</p>
                                                    </div>
                                                    <p className="text-2xl font-black text-primary">{formatPrice(orderPreview.totalAmount)}</p>
                                                </div>
                                            </div>

                                            <div className="mt-6 p-4 rounded-2xl bg-surface-container flex items-center justify-between border border-surface-variant/20">
                                                <div className="flex items-center gap-3">
                                                    <span className="material-symbols-outlined text-primary">payments</span>
                                                    <p className="font-semibold">Thanh toán khi nhận hàng (COD)</p>
                                                </div>
                                            </div>

                                            <Button type="submit" size="lg" className="w-full mt-6" disabled={isSubmitting}>
                                                {isSubmitting ? "Đang xử lý..." : "Đặt hàng"}
                                            </Button>
                                        </div>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
export default ProductDetail;
