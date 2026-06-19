import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import orderService from "../../services/order.service";
import reviewService from "../../services/review.service";
import toast from "react-hot-toast";

const TABS = ["Đơn mua", "Đơn bán"];
const ORDER_STATUS = {
  pending: { label: "Chờ xác nhận", color: "bg-orange-50 text-orange-600 border border-orange-200" },
  confirmed: { label: "Đã xác nhận", color: "bg-blue-50 text-blue-600 border border-blue-200" },
  shipping: { label: "Đang giao", color: "bg-cyan-50 text-cyan-600 border border-cyan-200" },
  delivered: { label: "Đã giao", color: "bg-teal-50 text-teal-600 border border-teal-200" },
  completed: { label: "Hoàn tất", color: "bg-green-50 text-green-600 border border-green-200" },
  cancelled: { label: "Đã hủy", color: "bg-red-50 text-red-600 border border-red-200" },
  disputed: { label: "Tranh chấp", color: "bg-purple-50 text-purple-600 border border-purple-200" }
};

const MyOrders = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState(0); // 0: Đơn mua, 1: Đơn bán
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [processingId, setProcessingId] = useState(null);
  const [showOrderDetail, setShowOrderDetail] = useState(null);

  // Review modal state
  const [reviewOpen, setReviewOpen] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = tab === 0 ? await orderService.getMyOrders() : await orderService.getMySales();
      if (res.success) setOrders(res.data);
    } catch (err) {
      toast.error("Lỗi lấy danh sách đơn hàng");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const updateStatus = async (id, action) => {
    setProcessingId(id);
    try {
      let res;
      if (action === "sellerConfirm") {
        res = await orderService.sellerConfirmOrder(id);
      } else if (action === "sellerReject") {
        res = await orderService.sellerRejectOrder(id, "Người bán từ chối đơn");
      } else if (action === "cancel") {
        res = await orderService.cancelOrder(id, "Hủy đơn hàng");
      } else if (action === "complete") {
        res = await orderService.buyerConfirmDelivery(id);
      }

      if (res.success) {
        toast.success("Cập nhật trạng thái thành công!");
        fetchOrders();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Lỗi khi cập nhật trạng thái");
    } finally {
      setProcessingId(null);
    }
  };

  const handleSubmitReview = async () => {
    if (!reviewOpen) return;
    try {
      await reviewService.createReview({
        reviewUserId: reviewOpen.sellerId?._id || reviewOpen.sellerId,
        postId: reviewOpen.postId?._id || reviewOpen.postId,
        orderId: reviewOpen._id,
        reviewType: "seller",
        rating,
        comment,
      });
      toast.success("Đã gửi đánh giá thành công!");
      setReviewOpen(null);
      setRating(5);
      setComment("");
      fetchOrders();
    } catch (err) {
      toast.error(err.response?.data?.message || "Lỗi khi gửi đánh giá");
    }
  };

  const getImageUrl = (img) => {
    if (!img) return "https://placehold.co/200?text=No+Image";
    if (img.startsWith("http")) return img;
    return `http://localhost:5000${img}`;
  };

  const formatPrice = (num) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num || 0);
  const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString("vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit", year: "numeric" });

  return (
    <div className="flex min-h-screen bg-[#F5F5F7] font-sans">
      <Sidebar variant="user" />
      <main className="flex-1 md:ml-64 px-4 md:px-10 py-10">
        <div className="max-w-5xl mx-auto">

          <header className="mb-10 flex flex-col md:flex-row justify-between md:items-end gap-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-on-surface mb-2 flex items-center gap-3">
                <span className="material-symbols-outlined text-primary text-4xl">shopping_bag</span>
                Quản lý Đơn hàng
              </h1>
              <p className="text-on-surface-variant text-base">Theo dõi và cập nhật trạng thái mua bán của bạn.</p>
            </div>

            {/* Tabs */}
            <div className="flex bg-white rounded-full p-1.5 shadow-sm border border-surface-variant/30 w-fit">
              {TABS.map((t, i) => (
                <button key={t} onClick={() => setTab(i)}
                  className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all ${tab === i ? "bg-gradient-to-r from-primary to-primary-fixed text-white shadow-md scale-105" : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container"
                    }`}>
                  {t}
                </button>
              ))}
            </div>
          </header>

          {loading ? (
            <div className="flex justify-center items-center py-20">
              <span className="material-symbols-outlined text-primary text-5xl animate-spin">refresh</span>
            </div>
          ) : orders.length === 0 ? (
            <div className="bg-white rounded-3xl py-20 text-center border border-surface-variant/20 shadow-sm flex flex-col items-center">
              <div className="w-24 h-24 bg-surface-container-low rounded-full flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-6xl text-primary/50">inbox</span>
              </div>
              <h3 className="text-xl font-bold text-on-surface mb-2">Chưa có đơn hàng nào</h3>
              <p className="text-on-surface-variant max-w-sm mx-auto">Bạn chưa có giao dịch nào trong mục này. Khám phá ngay các món đồ hấp dẫn trên EcoTrade!</p>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {orders.map((order) => {
                const s = ORDER_STATUS[order.orderStatus] || { label: order.orderStatus, color: "bg-surface-variant text-on-surface" };
                const otherPartyName = tab === 0 ? (order.sellerId?.name || "N/A") : (order.buyerId?.name || "N/A");
                const isProcessing = processingId === order._id;

                return (
                  <div key={order._id} className="bg-white rounded-3xl shadow-sm hover:shadow-apple transition-all border border-surface-variant/20 overflow-hidden flex flex-col group">
                    <div className="p-6 md:p-8 flex items-start flex-col lg:flex-row justify-between gap-6 relative">
                      {isProcessing && (
                        <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-10 flex items-center justify-center">
                          <span className="material-symbols-outlined text-primary text-3xl animate-spin">refresh</span>
                        </div>
                      )}
                      <div className="flex items-start gap-5 flex-1 w-full">
                        <div className="w-24 h-24 rounded-2xl overflow-hidden bg-surface-container-low flex-shrink-0 shadow-inner p-1 border border-surface-variant/30">
                          <img src={getImageUrl(order.postId?.images?.[0])} alt="" className="w-full h-full object-cover rounded-xl" />
                        </div>
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-3 mb-1">
                            <h3 className="font-bold text-on-surface text-lg md:text-xl line-clamp-1">{order.postId?.title || "Sản phẩm không xác định"}</h3>
                            <span className={`text-[11px] px-3 py-1 rounded-full font-bold uppercase tracking-wider ${s.color}`}>
                              {s.label}
                            </span>
                          </div>
                          <p className="text-sm text-on-surface-variant mb-2">
                            Mã đơn: <span className="font-mono text-on-surface">{order._id.substring(0, 8).toUpperCase()}</span> • {formatDate(order.createdAt)}
                          </p>
                          <div className="flex items-center gap-2 bg-surface-container-low w-fit px-3 py-1.5 rounded-lg border border-surface-variant/20 text-sm">
                            <span className="material-symbols-outlined text-[18px] text-primary">person</span>
                            <span className="text-on-surface-variant">{tab === 0 ? "Người bán:" : "Người mua:"} <strong className="text-on-surface">{otherPartyName}</strong></span>
                          </div>
                        </div>
                      </div>

                      <div className="text-left lg:text-right w-full lg:w-auto mt-2 lg:mt-0 pt-4 lg:pt-0 border-t lg:border-t-0 border-surface-variant/30 flex lg:flex-col justify-between items-center lg:items-end">
                        <span className="text-sm text-on-surface-variant lg:mb-1 block">Tổng thanh toán</span>
                        <p className="font-black text-primary text-2xl">{formatPrice(order.totalAmount)}</p>
                      </div>
                    </div>

                    {/* Actions bar */}
                    <div className="bg-surface-container-lowest/50 px-6 py-4 md:px-8 border-t border-surface-variant/30 flex flex-wrap items-center justify-between gap-4">
                      <button onClick={() => setShowOrderDetail(order)} className="text-primary font-semibold text-sm hover:underline flex items-center gap-1 transition-all group-hover:translate-x-1">
                        Xem chi tiết <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                      </button>

                      <div className="flex flex-wrap gap-3">
                        {/* BUYER ACTIONS */}
                        {tab === 0 && order.orderStatus === "pending" && (
                          <button onClick={() => updateStatus(order._id, "cancel")} disabled={isProcessing}
                            className="px-5 py-2 text-sm font-bold border-2 border-error/20 text-error rounded-xl hover:bg-error/5 hover:border-error/40 transition-all active:scale-95 disabled:opacity-50">
                            Hủy đơn
                          </button>
                        )}
                        {tab === 0 && order.orderStatus === "delivered" && (
                          <button onClick={() => updateStatus(order._id, "complete")} disabled={isProcessing}
                            className="px-5 py-2 text-sm font-bold bg-primary text-white rounded-xl hover:shadow-lg hover:shadow-primary/30 transition-all active:scale-95 disabled:opacity-50">
                            Đã nhận hàng (Hoàn tất)
                          </button>
                        )}
                        {tab === 0 && order.orderStatus === "completed" && (
                          <button onClick={() => setReviewOpen(order)}
                            className="px-5 py-2 text-sm font-bold bg-gradient-to-r from-orange-400 to-orange-500 text-white rounded-xl hover:shadow-lg hover:shadow-orange-500/30 transition-all active:scale-95 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[16px]">star</span> Đánh giá
                          </button>
                        )}

                        {/* SELLER ACTIONS */}
                        {tab === 1 && order.orderStatus === "pending" && (
                          <>
                            <button onClick={() => updateStatus(order._id, "sellerReject")} disabled={isProcessing}
                              className="px-5 py-2 text-sm font-bold border-2 border-error/20 text-error rounded-xl hover:bg-error/5 hover:border-error/40 transition-all active:scale-95 disabled:opacity-50">
                              Từ chối
                            </button>
                            <button onClick={() => updateStatus(order._id, "sellerConfirm")} disabled={isProcessing}
                              className="px-5 py-2 text-sm font-bold bg-primary text-white rounded-xl hover:shadow-lg hover:shadow-primary/30 transition-all active:scale-95 disabled:opacity-50">
                              Xác nhận đơn
                            </button>
                          </>
                        )}
                        {tab === 1 && order.orderStatus === "confirmed" && (
                          <span className="px-4 py-2 bg-surface-container text-on-surface-variant rounded-xl text-sm font-medium border border-surface-variant/30">
                            Chờ Shipper lấy hàng
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Review Modal with beautiful design */}
      {reviewOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] px-4">
          <div className="bg-white rounded-3xl p-8 shadow-2xl w-full max-w-md animate-scale-up border border-surface-variant/20">
            <div className="w-16 h-16 bg-orange-100 text-orange-500 rounded-full flex items-center justify-center mb-4 mx-auto">
              <span className="material-symbols-outlined text-3xl">star_rate</span>
            </div>
            <h3 className="font-extrabold text-on-surface text-2xl text-center mb-1">Đánh giá người bán</h3>
            <p className="text-sm text-on-surface-variant text-center mb-8">{reviewOpen.postId?.title}</p>

            <div className="flex items-center justify-center gap-3 mb-8">
              {[1, 2, 3, 4, 5].map((star) => (
                <button key={star} onClick={() => setRating(star)} className="hover:scale-110 transition-transform">
                  <span className={`material-symbols-outlined text-4xl ${star <= rating ? "text-orange-400" : "text-surface-variant/40"}`} style={{ fontVariationSettings: "'FILL' 1" }}>
                    star
                  </span>
                </button>
              ))}
            </div>

            <label className="block text-sm font-bold text-on-surface mb-2">Cảm nhận của bạn</label>
            <textarea
              className="w-full px-4 py-3 border border-surface-variant/50 rounded-2xl text-sm bg-surface-container-lowest focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none resize-none min-h-[120px] mb-6 transition-all"
              placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm và người bán..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />

            <div className="flex gap-4">
              <button onClick={() => setReviewOpen(null)}
                className="flex-1 py-3.5 border-2 border-surface-variant/30 rounded-full text-base font-bold hover:bg-surface-container transition-all text-on-surface-variant">
                Đóng
              </button>
              <button onClick={handleSubmitReview} className="flex-1 py-3.5 bg-gradient-to-r from-orange-400 to-orange-500 text-white rounded-full text-base font-bold hover:shadow-lg hover:shadow-orange-500/30 transition-all active:scale-95">
                Gửi đánh giá
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order Detail Popup */}
      {showOrderDetail && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] px-4 overflow-y-auto py-8">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl border border-surface-variant/20">
            <div className="p-8">
              <div className="flex items-start justify-between gap-6 mb-6">
                <div>
                  <h2 className="text-2xl font-extrabold text-on-surface mb-2">
                    Chi tiết đơn hàng #{showOrderDetail._id.slice(-6).toUpperCase()}
                  </h2>
                  <span className={`text-xs px-3 py-1 rounded-full font-bold ${ORDER_STATUS[showOrderDetail.orderStatus]?.color || "bg-surface-variant text-on-surface"}`}>
                    {ORDER_STATUS[showOrderDetail.orderStatus]?.label || showOrderDetail.orderStatus}
                  </span>
                </div>
                <button onClick={() => setShowOrderDetail(null)} className="p-2 hover:bg-surface-container-low rounded-xl transition-all text-on-surface-variant">
                  <span className="material-symbols-outlined text-2xl">close</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* Người bán */}
                <div className="p-4 bg-surface-container-low rounded-2xl border border-surface-variant/20">
                  <h4 className="text-sm font-bold text-on-surface-variant uppercase tracking-wider mb-3">Người bán</h4>
                  <p className="text-lg font-semibold text-on-surface">{showOrderDetail.sellerId?.fullName || "N/A"}</p>
                  {showOrderDetail.sellerId?.phone && (
                    <p className="text-sm text-on-surface-variant mt-1">Điện thoại: {showOrderDetail.sellerId.phone}</p>
                  )}
                  {showOrderDetail.sellerId?.address && (
                    <p className="text-sm text-on-surface-variant mt-1">Địa chỉ: {showOrderDetail.sellerId.address}</p>
                  )}
                </div>

                {/* Người mua */}
                <div className="p-4 bg-surface-container-low rounded-2xl border border-surface-variant/20">
                  <h4 className="text-sm font-bold text-on-surface-variant uppercase tracking-wider mb-3">Người mua</h4>
                  <p className="text-lg font-semibold text-on-surface">{showOrderDetail.buyerId?.fullName || "N/A"}</p>
                  {showOrderDetail.buyerPhone && (
                    <p className="text-sm text-on-surface-variant mt-1">Điện thoại: {showOrderDetail.buyerPhone}</p>
                  )}
                  {showOrderDetail.buyerAddress && (
                    <p className="text-sm text-on-surface-variant mt-1">Địa chỉ: {showOrderDetail.buyerAddress}</p>
                  )}
                </div>
              </div>

              {/* Sản phẩm */}
              <div className="mb-8">
                <h4 className="text-sm font-bold text-on-surface-variant uppercase tracking-wider mb-4">Sản phẩm</h4>
                <div className="flex items-start gap-4 p-4 bg-surface-container-low rounded-2xl border border-surface-variant/20">
                  {showOrderDetail.postId?.thumbnailUrl ? (
                    <img src={getImageUrl(showOrderDetail.postId.thumbnailUrl)} alt="" className="w-24 h-24 object-cover rounded-xl" />
                  ) : (
                    <div className="w-24 h-24 bg-surface-variant/20 rounded-xl flex items-center justify-center">
                      <span className="material-symbols-outlined text-3xl text-on-surface-variant">image</span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h5 className="font-semibold text-on-surface text-lg">{showOrderDetail.postId?.title || "Sản phẩm"}</h5>
                    <p className="text-sm text-on-surface-variant mt-1">{showOrderDetail.postId?.conditionStatus || ""}</p>
                    <p className="text-xl font-black text-primary mt-2">{formatPrice(showOrderDetail.productPrice)}</p>
                  </div>
                </div>
              </div>

              {/* Thông tin giao hàng */}
              {showOrderDetail.buyerAddress && (
                <div className="mb-8">
                  <h4 className="text-sm font-bold text-on-surface-variant uppercase tracking-wider mb-4">Thông tin nhận hàng</h4>
                  <div className="p-4 bg-surface-container-low rounded-2xl border border-surface-variant/20">
                    <p className="text-base text-on-surface"><span className="font-medium">Người nhận:</span> {showOrderDetail.recipientName || showOrderDetail.buyerId?.fullName}</p>
                    <p className="text-base text-on-surface mt-2"><span className="font-medium">Địa chỉ:</span> {showOrderDetail.buyerAddress}</p>
                    <p className="text-base text-on-surface mt-2"><span className="font-medium">Điện thoại:</span> {showOrderDetail.buyerPhone}</p>
                    {showOrderDetail.note && (
                      <p className="text-sm text-on-surface-variant mt-3"><span className="font-medium">Ghi chú:</span> {showOrderDetail.note}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Tổng kết */}
              <div className="p-4 bg-primary/5 rounded-2xl border border-primary/20">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-on-surface-variant">Tạm tính</span>
                  <span className="text-base font-medium text-on-surface">{formatPrice(showOrderDetail.productPrice)}</span>
                </div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-on-surface-variant">Phí vận chuyển</span>
                  <span className="text-base font-medium text-on-surface">{formatPrice(showOrderDetail.shippingFee)}</span>
                </div>
                {showOrderDetail.cancelReason && (
                  <div className="flex items-center justify-between mb-3 p-3 bg-red-50 rounded-xl border border-red-200">
                    <span className="text-sm text-red-600">Lý do hủy</span>
                    <span className="text-sm font-medium text-red-700">{showOrderDetail.cancelReason}</span>
                  </div>
                )}
                <div className="pt-4 border-t border-surface-variant/20 flex items-center justify-between">
                  <span className="text-base font-bold text-on-surface">Tổng cộng</span>
                  <span className="text-2xl font-black text-primary">{formatPrice(showOrderDetail.totalAmount)}</span>
                </div>
              </div>
            </div>

            <div className="px-8 pb-8 pt-4 border-t border-surface-variant/20 flex justify-end">
              <button onClick={() => setShowOrderDetail(null)}
                className="px-6 py-2.5 border-2 border-surface-variant/30 rounded-full text-base font-bold hover:bg-surface-container transition-all text-on-surface-variant">
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default MyOrders;
