import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import EcoTradeLayout from "../../components/ecotrade/EcoTradeLayout";
import orderService from "../../services/order.service";
import reviewService from "../../services/review.service";
import toast from "react-hot-toast";

const TABS = ["Don mua", "Don ban"];
const ORDER_STATUS = {
  pending: { label: "Chờ xác nhận", color: "bg-amber-50 text-amber-600 border-amber-100" },
  confirmed: { label: "Đã xác nhận", color: "bg-blue-50 text-blue-600 border-blue-100" },
  shipping: { label: "Đang giao", color: "bg-sky-50 text-sky-600 border-sky-100" },
  delivered: { label: "Đã giao", color: "bg-emerald-50 text-emerald-600 border-emerald-100" },
  completed: { label: "Hoàn tất", color: "bg-primary/5 text-primary border-primary/10" },
  cancelled: { label: "Đã hủy", color: "bg-error/5 text-error border-error/10" },
};

const MyOrders = () => {
  const [tab, setTab] = useState(0);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [processingId, setProcessingId] = useState(null);
  const [reviewOpen, setReviewOpen] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = tab === 0 ? await orderService.getMyOrders() : await orderService.getMySales();
      if (res.success) {
        setOrders(res.data);
      }
    } catch (err) {
      toast.error("Lỗi khi lấy danh sách đơn hàng");
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const updateStatus = async (id, status) => {
    setProcessingId(id);
    try {
      let extra = {};
      if (status === "cancelled") {
        const reason = window.prompt("Nhập lý do hủy / từ chối đơn", "");
        if (reason === null) {
          setProcessingId(null);
          return;
        }
        extra = { cancelReason: reason };
      }

      const res = await orderService.updateOrderStatus(id, status, extra);
      if (res.success) {
        toast.success("Cập nhật trạng thái thành công");
        await fetchOrders();
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
      toast.success("Đã gửi đánh giá thành công");
      setReviewOpen(null);
      setRating(5);
      setComment("");
      await fetchOrders();
    } catch (err) {
      toast.error(err.response?.data?.message || "Lỗi khi gửi đánh giá");
    }
  };

  const getImageUrl = (img) => {
    if (!img) return "https://placehold.co/200?text=No+Image";
    return img;
  };

  const formatPrice = (num) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(num || 0);
  const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

  return (
    <EcoTradeLayout>
        <div className="max-w-5xl mx-auto">
          <header className="mb-12 flex flex-col md:flex-row justify-between md:items-end gap-8">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/5 border border-primary/10 mb-4">
                <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse"></div>
                <span className="text-[10px] font-black text-primary/60 uppercase tracking-widest">Trung tâm giao dịch</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-display font-black text-foreground tracking-tight mb-3">
                Quản lý Đơn hàng
              </h1>
              <p className="text-on-surface-variant font-medium">Theo dõi hành trình của từng đơn hàng bạn đã giao dịch.</p>
            </div>

            <div className="flex bg-white rounded-pill p-1.5 shadow-apple-md border border-primary/5 w-fit">
              {TABS.map((label, index) => (
                <button
                  key={label}
                  onClick={() => setTab(index)}
                  className={`px-8 py-3 rounded-pill text-sm font-bold transition-all ${
                    tab === index
                      ? "bg-primary text-white shadow-lg shadow-primary/20 scale-105"
                      : "text-on-surface-variant hover:text-primary hover:bg-primary/5"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </header>

          {loading ? (
            <div className="space-y-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-organic shadow-sm border border-primary/5 p-8 animate-pulse">
                   <div className="flex gap-6">
                      <div className="w-24 h-24 rounded-2xl bg-primary/5" />
                      <div className="flex-1 space-y-4">
                        <div className="h-6 w-1/3 bg-primary/5 rounded-full" />
                        <div className="h-4 w-1/4 bg-primary/5 rounded-full" />
                      </div>
                   </div>
                </div>
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="bg-white rounded-organic py-24 text-center border border-primary/5 shadow-apple-md flex flex-col items-center">
              <div className="w-24 h-24 bg-primary/5 rounded-full flex items-center justify-center mb-8">
                <span className="material-symbols-outlined text-6xl text-primary/20">inventory_2</span>
              </div>
              <h3 className="text-2xl font-display font-black text-foreground mb-3">Chưa có giao dịch nào</h3>
              <p className="text-on-surface-variant max-w-sm mx-auto font-medium">
                Khám phá các sản phẩm xanh trên EcoTrade để bắt đầu hành trình tiêu dùng bền vững của bạn.
              </p>
              <Link to="/marketplace" className="mt-8 rounded-pill bg-primary px-8 py-3 text-sm font-black uppercase tracking-widest text-white shadow-lg shadow-primary/20 hover:scale-105 transition-all">
                Đến chợ đồ cũ
              </Link>
            </div>
          ) : (
            <div className="space-y-8">
              {orders.map((order) => {
                const statusInfo = ORDER_STATUS[order.orderStatus] || {
                  label: order.orderStatus,
                  color: "bg-surface-variant text-on-surface",
                };
                const otherPartyName =
                  tab === 0
                    ? order.sellerId?.fullName || order.sellerId?.name || "N/A"
                    : order.buyerId?.fullName || order.buyerId?.name || "N/A";
                const isProcessing = processingId === order._id;

                return (
                  <div
                    key={order._id}
                    className="bg-white rounded-organic shadow-sm hover:shadow-apple-md transition-all border border-primary/5 overflow-hidden group"
                  >
                    <div className="p-8 flex items-start flex-col lg:flex-row justify-between gap-8 relative">
                      {isProcessing && (
                        <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-10 flex items-center justify-center">
                          <div className="h-10 w-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                        </div>
                      )}

                      <div className="flex items-start gap-6 flex-1 w-full">
                        <div className="w-24 h-24 rounded-2xl overflow-hidden bg-primary/5 flex-shrink-0 shadow-inner p-1 border border-primary/10">
                          <img
                            src={getImageUrl(order.productImage || order.postId?.images?.[0])}
                            alt=""
                            className="w-full h-full object-cover rounded-xl transition-transform group-hover:scale-110"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-3 mb-2">
                            <h3 className="font-display font-black text-foreground text-xl md:text-2xl truncate">
                              {order.postId?.title || "Sản phẩm không xác định"}
                            </h3>
                            <span className={`text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-widest border ${statusInfo.color}`}>
                              {statusInfo.label}
                            </span>
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-on-surface-variant/40 uppercase tracking-widest mb-4">
                            <span>Mã đơn: <span className="font-mono text-primary/60">{order._id.substring(0, 8).toUpperCase()}</span></span>
                            <span className="w-1 h-1 rounded-full bg-primary/10"></span>
                            <span>{formatDate(order.createdAt)}</span>
                          </div>

                          <div className="flex items-center gap-3 bg-background/50 w-fit px-4 py-2 rounded-2xl border border-primary/5 text-sm font-bold">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-primary shadow-sm">
                               <span className="material-symbols-outlined text-[18px]">person</span>
                            </div>
                            <span className="text-foreground">
                              {tab === 0 ? "Người bán:" : "Người mua:"}{" "}
                              <span className="text-primary">{otherPartyName}</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="text-left lg:text-right w-full lg:w-auto flex lg:flex-col justify-between items-center lg:items-end p-6 bg-background/30 rounded-2xl border border-primary/5">
                        <span className="text-[10px] font-black uppercase tracking-widest text-primary/40 lg:mb-1">Tổng cộng</span>
                        <p className="font-display font-black text-primary text-3xl">{formatPrice(order.totalAmount)}</p>
                      </div>
                    </div>

                    <div className="bg-primary/5 px-8 py-5 border-t border-primary/5 flex flex-wrap items-center justify-between gap-6">
                      <Link
                        to={`/orders/${order._id}`}
                        className="text-primary font-black text-xs uppercase tracking-widest flex items-center gap-2 transition-all hover:translate-x-1 group-hover:text-primary/70"
                      >
                        Chi tiết lộ trình <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                      </Link>

                      <div className="flex flex-wrap gap-4">
                        {tab === 0 && order.actions?.canBuyerCancel && (
                          <button
                            onClick={() => updateStatus(order._id, "cancelled")}
                            disabled={isProcessing}
                            className="px-8 py-3 text-xs font-black uppercase tracking-widest border-2 border-error/10 text-error rounded-pill hover:bg-error/5 hover:border-error/30 transition-all active:scale-95 disabled:opacity-50"
                          >
                            Hủy đơn
                          </button>
                        )}

                        {tab === 0 && order.actions?.canBuyerComplete && (
                          <button
                            onClick={() => updateStatus(order._id, "completed")}
                            disabled={isProcessing}
                            className="px-8 py-3 text-xs font-black uppercase tracking-widest bg-primary text-white rounded-pill shadow-lg shadow-primary/20 hover:scale-105 hover:bg-primary/90 transition-all active:scale-95 disabled:opacity-50"
                          >
                            Đã nhận hàng
                          </button>
                        )}

                        {tab === 0 && order.orderStatus === "completed" && (
                          <button
                            onClick={() => setReviewOpen(order)}
                            className="px-8 py-3 text-xs font-black uppercase tracking-widest bg-secondary text-white rounded-pill shadow-lg shadow-secondary/20 hover:scale-105 hover:bg-secondary/90 transition-all active:scale-95 flex items-center gap-2"
                          >
                            <span className="material-symbols-outlined text-[16px]">star</span>
                            Đánh giá ngay
                          </button>
                        )}

                        {tab === 1 && order.actions?.canSellerReject && (
                          <button
                            onClick={() => updateStatus(order._id, "cancelled")}
                            disabled={isProcessing}
                            className="px-8 py-3 text-xs font-black uppercase tracking-widest border-2 border-error/10 text-error rounded-pill hover:bg-error/5 hover:border-error/30 transition-all active:scale-95 disabled:opacity-50"
                          >
                            Từ chối
                          </button>
                        )}

                        {tab === 1 && order.actions?.canSellerConfirm && (
                          <button
                            onClick={() => updateStatus(order._id, "confirmed")}
                            disabled={isProcessing}
                            className="px-8 py-3 text-xs font-black uppercase tracking-widest bg-primary text-white rounded-pill shadow-lg shadow-primary/20 hover:scale-105 hover:bg-primary/90 transition-all active:scale-95 disabled:opacity-50"
                          >
                            Xác nhận đơn
                          </button>
                        )}

                        {tab === 1 && order.orderStatus === "confirmed" && (
                          <div className="flex items-center gap-2 px-6 py-3 bg-white/50 text-on-surface-variant rounded-pill text-[10px] font-black uppercase tracking-widest border border-primary/10">
                            <div className="h-1.5 w-1.5 rounded-full bg-secondary animate-pulse"></div>
                            Chờ shipper
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      {reviewOpen && (
        <div className="fixed inset-0 bg-primary/20 backdrop-blur-md flex items-center justify-center z-[100] px-4">
          <div className="bg-white rounded-organic p-10 shadow-2xl w-full max-w-lg animate-scale-up border border-primary/5 relative overflow-hidden">
            <div className="absolute -right-20 -top-20 h-48 w-48 rounded-full bg-secondary/10 blur-3xl"></div>
            
            <div className="relative z-10">
              <div className="w-20 h-20 bg-secondary/10 text-secondary rounded-2xl flex items-center justify-center mb-6 mx-auto shadow-sm border border-secondary/10">
                <span className="material-symbols-outlined text-4xl">star_rate</span>
              </div>
              <h3 className="font-display font-black text-foreground text-3xl text-center mb-2">Đánh giá giao dịch</h3>
              <p className="text-sm font-medium text-on-surface-variant text-center mb-10">{reviewOpen.postId?.title}</p>

              <div className="flex items-center justify-center gap-4 mb-10">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button key={star} onClick={() => setRating(star)} className="hover:scale-125 transition-all transform active:scale-90">
                    <span
                      className={`material-symbols-outlined text-5xl ${star <= rating ? "text-secondary" : "text-primary/10"}`}
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      star
                    </span>
                  </button>
                ))}
              </div>

              <div className="mb-8">
                <label className="block text-[10px] font-black uppercase tracking-widest text-primary/40 mb-3">Cảm nhận của bạn</label>
                <textarea
                  className="w-full px-6 py-4 border border-primary/10 rounded-2xl text-sm font-bold bg-background/30 focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none resize-none min-h-[140px] transition-all placeholder:text-foreground/20"
                  placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm và người bán..."
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                />
              </div>

              <div className="flex flex-col md:flex-row gap-4">
                <button
                  onClick={() => setReviewOpen(null)}
                  className="flex-1 py-4 border-2 border-primary/10 rounded-pill text-xs font-black uppercase tracking-widest text-primary hover:bg-primary/5 transition-all"
                >
                  Đóng lại
                </button>
                <button
                  onClick={handleSubmitReview}
                  className="flex-1 py-4 bg-primary text-white rounded-pill text-xs font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-105 hover:bg-primary/90 transition-all active:scale-95"
                >
                  Gửi đánh giá
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </EcoTradeLayout>
  );
};

export default MyOrders;
