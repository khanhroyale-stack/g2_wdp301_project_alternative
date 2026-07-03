import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import orderService from "../../services/order.service";
import reviewService from "../../services/review.service";
import toast from "react-hot-toast";

const TABS = ["Don mua", "Don ban"];
const ORDER_STATUS = {
  pending: { label: "Cho xac nhan", color: "bg-orange-50 text-orange-600 border border-orange-200" },
  confirmed: { label: "Da xac nhan", color: "bg-blue-50 text-blue-600 border border-blue-200" },
  shipping: { label: "Dang giao", color: "bg-cyan-50 text-cyan-600 border border-cyan-200" },
  delivered: { label: "Da giao", color: "bg-teal-50 text-teal-600 border border-teal-200" },
  completed: { label: "Hoan tat", color: "bg-green-50 text-green-600 border border-green-200" },
  cancelled: { label: "Da huy", color: "bg-red-50 text-red-600 border border-red-200" },
};

const MyOrders = () => {
  const [tab, setTab] = useState(0);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [processingId, setProcessingId] = useState(null);
  const [reviewOpen, setReviewOpen] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = tab === 0 ? await orderService.getMyOrders() : await orderService.getMySales();
      if (res.success) {
        setOrders(res.data);
      }
    } catch (err) {
      toast.error("Loi lay danh sach don hang");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [tab]);

  const updateStatus = async (id, status) => {
    setProcessingId(id);
    try {
      let extra = {};
      if (status === "cancelled") {
        const reason = window.prompt("Nhap ly do huy / tu choi don", "");
        if (reason === null) {
          setProcessingId(null);
          return;
        }
        extra = { cancelReason: reason };
      }

      const res = await orderService.updateOrderStatus(id, status, extra);
      if (res.success) {
        toast.success("Cap nhat trang thai thanh cong");
        await fetchOrders();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Loi khi cap nhat trang thai");
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
      toast.success("Da gui danh gia thanh cong");
      setReviewOpen(null);
      setRating(5);
      setComment("");
      await fetchOrders();
    } catch (err) {
      toast.error(err.response?.data?.message || "Loi khi gui danh gia");
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
    <div className="flex min-h-screen bg-[#F5F5F7] font-sans">
      <Sidebar variant="user" />
      <main className="flex-1 md:ml-72 px-4 md:px-10 py-10">
        <div className="max-w-5xl mx-auto">
          <header className="mb-10 flex flex-col md:flex-row justify-between md:items-end gap-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-on-surface mb-2 flex items-center gap-3">
                <span className="material-symbols-outlined text-primary text-4xl">shopping_bag</span>
                Quan ly Don hang
              </h1>
              <p className="text-on-surface-variant text-base">Theo doi va cap nhat trang thai mua ban cua ban.</p>
            </div>

            <div className="flex bg-white rounded-full p-1.5 shadow-sm border border-surface-variant/30 w-fit">
              {TABS.map((label, index) => (
                <button
                  key={label}
                  onClick={() => setTab(index)}
                  className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all ${
                    tab === index
                      ? "bg-gradient-to-r from-primary to-primary-fixed text-white shadow-md scale-105"
                      : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container"
                  }`}
                >
                  {label}
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
              <h3 className="text-xl font-bold text-on-surface mb-2">Chua co don hang nao</h3>
              <p className="text-on-surface-variant max-w-sm mx-auto">
                Ban chua co giao dich nao trong muc nay. Kham pha cac mon do tren EcoTrade de bat dau.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
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
                    className="bg-white rounded-3xl shadow-sm hover:shadow-apple transition-all border border-surface-variant/20 overflow-hidden flex flex-col group"
                  >
                    <div className="p-6 md:p-8 flex items-start flex-col lg:flex-row justify-between gap-6 relative">
                      {isProcessing ? (
                        <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-10 flex items-center justify-center">
                          <span className="material-symbols-outlined text-primary text-3xl animate-spin">refresh</span>
                        </div>
                      ) : null}

                      <div className="flex items-start gap-5 flex-1 w-full">
                        <div className="w-24 h-24 rounded-2xl overflow-hidden bg-surface-container-low flex-shrink-0 shadow-inner p-1 border border-surface-variant/30">
                          <img
                            src={getImageUrl(order.productImage || order.postId?.images?.[0])}
                            alt=""
                            className="w-full h-full object-cover rounded-xl"
                          />
                        </div>
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-3 mb-1">
                            <h3 className="font-bold text-on-surface text-lg md:text-xl line-clamp-1">
                              {order.postId?.title || "San pham khong xac dinh"}
                            </h3>
                            <span className={`text-[11px] px-3 py-1 rounded-full font-bold uppercase tracking-wider ${statusInfo.color}`}>
                              {statusInfo.label}
                            </span>
                          </div>
                          <p className="text-sm text-on-surface-variant mb-2">
                            Ma don: <span className="font-mono text-on-surface">{order._id.substring(0, 8).toUpperCase()}</span> •{" "}
                            {formatDate(order.createdAt)}
                          </p>
                          <div className="flex items-center gap-2 bg-surface-container-low w-fit px-3 py-1.5 rounded-lg border border-surface-variant/20 text-sm">
                            <span className="material-symbols-outlined text-[18px] text-primary">person</span>
                            <span className="text-on-surface-variant">
                              {tab === 0 ? "Nguoi ban:" : "Nguoi mua:"}{" "}
                              <strong className="text-on-surface">{otherPartyName}</strong>
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="text-left lg:text-right w-full lg:w-auto mt-2 lg:mt-0 pt-4 lg:pt-0 border-t lg:border-t-0 border-surface-variant/30 flex lg:flex-col justify-between items-center lg:items-end">
                        <span className="text-sm text-on-surface-variant lg:mb-1 block">Tong thanh toan</span>
                        <p className="font-black text-primary text-2xl">{formatPrice(order.totalAmount)}</p>
                      </div>
                    </div>

                    <div className="bg-surface-container-lowest/50 px-6 py-4 md:px-8 border-t border-surface-variant/30 flex flex-wrap items-center justify-between gap-4">
                      <Link
                        to={`/orders/${order._id}`}
                        className="text-primary font-semibold text-sm hover:underline flex items-center gap-1 transition-all group-hover:translate-x-1"
                      >
                        Xem chi tiet <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                      </Link>

                      <div className="flex flex-wrap gap-3">
                        {tab === 0 && order.actions?.canBuyerCancel ? (
                          <button
                            onClick={() => updateStatus(order._id, "cancelled")}
                            disabled={isProcessing}
                            className="px-5 py-2 text-sm font-bold border-2 border-error/20 text-error rounded-xl hover:bg-error/5 hover:border-error/40 transition-all active:scale-95 disabled:opacity-50"
                          >
                            Huy don
                          </button>
                        ) : null}

                        {tab === 0 && order.actions?.canBuyerComplete ? (
                          <button
                            onClick={() => updateStatus(order._id, "completed")}
                            disabled={isProcessing}
                            className="px-5 py-2 text-sm font-bold bg-primary text-white rounded-xl hover:shadow-lg hover:shadow-primary/30 transition-all active:scale-95 disabled:opacity-50"
                          >
                            Da nhan hang (Hoan tat)
                          </button>
                        ) : null}

                        {tab === 0 && order.orderStatus === "completed" ? (
                          <button
                            onClick={() => setReviewOpen(order)}
                            className="px-5 py-2 text-sm font-bold bg-gradient-to-r from-orange-400 to-orange-500 text-white rounded-xl hover:shadow-lg hover:shadow-orange-500/30 transition-all active:scale-95 flex items-center gap-1"
                          >
                            <span className="material-symbols-outlined text-[16px]">star</span>
                            Danh gia
                          </button>
                        ) : null}

                        {tab === 1 && order.actions?.canSellerReject ? (
                          <button
                            onClick={() => updateStatus(order._id, "cancelled")}
                            disabled={isProcessing}
                            className="px-5 py-2 text-sm font-bold border-2 border-error/20 text-error rounded-xl hover:bg-error/5 hover:border-error/40 transition-all active:scale-95 disabled:opacity-50"
                          >
                            Tu choi
                          </button>
                        ) : null}

                        {tab === 1 && order.actions?.canSellerConfirm ? (
                          <button
                            onClick={() => updateStatus(order._id, "confirmed")}
                            disabled={isProcessing}
                            className="px-5 py-2 text-sm font-bold bg-primary text-white rounded-xl hover:shadow-lg hover:shadow-primary/30 transition-all active:scale-95 disabled:opacity-50"
                          >
                            Xac nhan don
                          </button>
                        ) : null}

                        {tab === 1 && order.orderStatus === "confirmed" ? (
                          <span className="px-4 py-2 bg-surface-container text-on-surface-variant rounded-xl text-sm font-medium border border-surface-variant/30">
                            Cho shipper nhan don
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {reviewOpen ? (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] px-4">
          <div className="bg-white rounded-3xl p-8 shadow-2xl w-full max-w-md animate-scale-up border border-surface-variant/20">
            <div className="w-16 h-16 bg-orange-100 text-orange-500 rounded-full flex items-center justify-center mb-4 mx-auto">
              <span className="material-symbols-outlined text-3xl">star_rate</span>
            </div>
            <h3 className="font-extrabold text-on-surface text-2xl text-center mb-1">Danh gia nguoi ban</h3>
            <p className="text-sm text-on-surface-variant text-center mb-8">{reviewOpen.postId?.title}</p>

            <div className="flex items-center justify-center gap-3 mb-8">
              {[1, 2, 3, 4, 5].map((star) => (
                <button key={star} onClick={() => setRating(star)} className="hover:scale-110 transition-transform">
                  <span
                    className={`material-symbols-outlined text-4xl ${star <= rating ? "text-orange-400" : "text-surface-variant/40"}`}
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    star
                  </span>
                </button>
              ))}
            </div>

            <label className="block text-sm font-bold text-on-surface mb-2">Cam nhan cua ban</label>
            <textarea
              className="w-full px-4 py-3 border border-surface-variant/50 rounded-2xl text-sm bg-surface-container-lowest focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none resize-none min-h-[120px] mb-6 transition-all"
              placeholder="Chia se trai nghiem cua ban ve san pham va nguoi ban..."
              value={comment}
              onChange={(event) => setComment(event.target.value)}
            />

            <div className="flex gap-4">
              <button
                onClick={() => setReviewOpen(null)}
                className="flex-1 py-3.5 border-2 border-surface-variant/30 rounded-full text-base font-bold hover:bg-surface-container transition-all text-on-surface-variant"
              >
                Dong
              </button>
              <button
                onClick={handleSubmitReview}
                className="flex-1 py-3.5 bg-gradient-to-r from-orange-400 to-orange-500 text-white rounded-full text-base font-bold hover:shadow-lg hover:shadow-orange-500/30 transition-all active:scale-95"
              >
                Gui danh gia
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default MyOrders;
