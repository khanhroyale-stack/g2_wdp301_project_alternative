import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  HelpCircle,
  Package,
  PackageCheck,
  Search,
  Truck,
} from "lucide-react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import EcoTradeLayout from "../../components/ecotrade/EcoTradeLayout";
import ReviewModal from "../../components/reviews/ReviewModal";
import { useAuth } from "../../context/AuthContext";
import useRealtimeRefresh from "../../hooks/useRealtimeRefresh";
import { buildOrderTimeline, getDeliveryStatusInfo, getOrderStatusInfo } from "../../lib/orderFlow";
import orderService from "../../services/order.service";
import reviewService from "../../services/review.service";

const money = (value) => `${Number(value || 0).toLocaleString("vi-VN")} đ`;

const dateText = (value, options = {}) =>
  value
    ? new Date(value).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      ...options,
    })
    : "Chưa cập nhật";

const dateTimeText = (value) =>
  value
    ? new Date(value).toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
    : "Chưa cập nhật";

const shortCode = (order) => {
  const day = order?.createdAt ? new Date(order.createdAt) : new Date();
  const yyyymmdd = `${day.getFullYear()}${String(day.getMonth() + 1).padStart(2, "0")}${String(day.getDate()).padStart(2, "0")}`;
  return `ORD-${yyyymmdd}-${String(order?._id || "").slice(-4).toUpperCase()}`;
};

const initials = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

const chipClass = {
  success: "border-success/30 bg-success-soft text-success",
  sky: "border-sky/30 bg-sky-soft text-sky",
  warning: "border-warning/30 bg-warning-soft text-warning",
  danger: "border-danger/30 bg-danger-soft text-danger",
  muted: "border-surface-variant bg-surface text-on-surface-variant",
};

const statusTone = {
  pending: "warning",
  confirmed: "success",
  shipping: "sky",
  delivered: "success",
  completed: "success",
  cancelled: "danger",
};

const deliveryLabelMap = {
  standard: "Giao hàng tiết kiệm",
  express: "Giao hàng nhanh",
  economy: "Giao hàng tiết kiệm",
};

function StatusChip({ tone = "muted", children, className = "" }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold ${chipClass[tone] || chipClass.muted} ${className}`}>
      {children}
    </span>
  );
}

function SectionCard({ title, icon: Icon, children, className = "" }) {
  return (
    <section className={`rounded-[20px] border border-surface-variant/50 bg-white shadow-apple ${className}`}>
      <div className="border-b border-surface-variant/30 px-6 py-5">
        <div className="flex items-center gap-3 text-[1.15rem] font-bold text-on-surface">
          {Icon ? <Icon className="h-5 w-5 text-primary" /> : null}
          <span>{title}</span>
        </div>
      </div>
      <div className="px-6 py-5">{children}</div>
    </section>
  );
}

function InfoCard({ label, value, sub, icon: Icon, accent = "success", className = "" }) {
  const accentClasses = {
    success: "bg-success-soft text-success",
    sky: "bg-sky-soft text-sky",
    warning: "bg-warning-soft text-warning",
    danger: "bg-danger-soft text-danger",
    muted: "bg-surface-variant text-on-surface-variant",
  };

  return (
    <div className={`rounded-3xl border border-surface-variant/50 bg-white px-5 py-5 shadow-apple ${className}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-[12px] font-bold uppercase tracking-[0.12em] text-on-surface-variant">{label}</div>
          <div className="mt-2 text-[1.05rem] font-bold text-on-surface">{value}</div>
          {sub ? <div className="mt-1 text-sm text-on-surface-variant/80">{sub}</div> : null}
        </div>
        {Icon ? (
          <div className={`rounded-2xl p-3 ${accentClasses[accent] || accentClasses.muted}`}>
            <Icon className="h-5 w-5" />
          </div>
        ) : null}
      </div>
    </div>
  );
}

function PartyCard({ title, name, subtitle, fallback, meta, phone, email, address }) {
  return (
    <div className="rounded-3xl border border-surface-variant/50 bg-white p-5 shadow-apple">
      <div className="flex items-center gap-3">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-surface-container-high text-sm font-bold text-on-surface">
          {fallback || initials(name) || "--"}
        </div>
        <div className="min-w-0">
          <div className="text-[12px] font-bold uppercase tracking-[0.12em] text-primary">{title}</div>
          <div className="truncate text-[1.05rem] font-bold text-on-surface">{name}</div>
          {subtitle ? <div className="truncate text-sm text-on-surface-variant">{subtitle}</div> : null}
          {meta ? <div className="truncate text-sm text-on-surface-variant">{meta}</div> : null}
        </div>
      </div>
      <div className="mt-5 space-y-4 border-t border-surface-variant/30 pt-4 text-sm">
        <div>
          <div className="mb-1 text-[11px] font-bold uppercase tracking-[0.12em] text-on-surface-variant">Số điện thoại</div>
          <div className="text-on-surface">{phone || "Chưa cập nhật"}</div>
        </div>
        <div>
          <div className="mb-1 text-[11px] font-bold uppercase tracking-[0.12em] text-on-surface-variant">Email</div>
          <div className="text-on-surface">{email || "Chưa cập nhật"}</div>
        </div>
        <div>
          <div className="mb-1 text-[11px] font-bold uppercase tracking-[0.12em] text-on-surface-variant">Địa chỉ</div>
          <div className="leading-6 text-on-surface">{address || "Chưa cập nhật"}</div>
        </div>
      </div>
    </div>
  );
}

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);

  // Thông báo kết quả thanh toán VNPay khi được redirect về (?payment=success|failed)
  useEffect(() => {
    const payment = searchParams.get("payment");
    if (!payment) return;
    if (payment === "success") {
      toast.success("Thanh toán VNPay thành công!");
    } else if (payment === "failed") {
      toast.error("Thanh toán VNPay thất bại hoặc đã bị hủy. Đơn hàng đã được hủy.");
    }
    searchParams.delete("payment");
    setSearchParams(searchParams, { replace: true });
  }, [searchParams, setSearchParams]);

  const refreshOrder = useCallback(async () => {
    const res = await orderService.getOrderById(id);
    if (res.success) {
      setOrder(res.data);
    }
  }, [id]);

  useEffect(() => {
    setLoading(true);
    refreshOrder()
      .catch((error) => {
        toast.error(error.response?.data?.message || "Không thể tải chi tiết đơn hàng");
        navigate("/orders/my-orders");
      })
      .finally(() => setLoading(false));
  }, [navigate, refreshOrder]);
  useRealtimeRefresh("order", refreshOrder);

  const handleOrderAction = async (status) => {
    setProcessing(true);
    try {
      let extra = {};

      if (status === "cancelled") {
        const reason = window.prompt(
          order?.actions?.canSellerReject ? "Nhập lý do từ chối đơn hàng" : "Nhập lý do hủy đơn hàng",
          ""
        );
        if (reason === null) {
          return;
        }

        if (order?.actions?.canSellerReject && !reason.trim()) {
          toast.error("Vui lòng nhập lý do từ chối đơn hàng.");
          return;
        }

        extra = { cancelReason: reason.trim() };
      }

      const res = await orderService.updateOrderStatus(id, status, extra);
      if (res.success) {
        await refreshOrder();
        toast.success("Đã cập nhật trạng thái đơn hàng");
        if (status === "completed" && isBuyerView) {
          setShowReviewModal(true);
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Không thể cập nhật đơn hàng");
    } finally {
      setProcessing(false);
    }
  };

  useEffect(() => {
    const checkReviewStatus = async () => {
      if (!order || !user) return;
      try {
        const myReviewsRes = await reviewService.getMyReviews();
        if (myReviewsRes.success) {
          const hasReviewedThisOrder = myReviewsRes.data.some(
            (r) => String(r.orderId) === String(order._id)
          );
          setHasReviewed(hasReviewedThisOrder);
        }
      } catch (e) {
        console.error("Error checking review status:", e);
      }
    };
    checkReviewStatus();
  }, [order, user]);

  const trackCode = order ? shortCode(order) : "";
  const product = order?.postId || {};
  const delivery = order?.delivery || null;
  const orderStatusInfo = getOrderStatusInfo(order?.orderStatus);
  const deliveryStatusInfo = getDeliveryStatusInfo(delivery?.deliveryStatus);
  const isBuyerView = order?.actions?.isBuyer ?? String(order?.buyerId?._id || order?.buyerId) === String(user?._id);
  const canCancel = order?.actions?.canBuyerCancel || order?.actions?.canSellerReject;
  const canComplete = order?.actions?.canBuyerComplete;
  const canTrackDelivery = Boolean(delivery);

  const subtotal = Number(order?.productPrice || 0) * Number(order?.quantity || 1);
  const shippingFee = Number(order?.shippingFee || 0);
  const total = Number(order?.totalAmount || 0);
  const shippingMethod = deliveryLabelMap[delivery?.deliveryType] || "Giao hàng tiết kiệm";
  const orderDate = dateText(order?.createdAt);
  const estimatedDelivery = useMemo(() => {
    if (!order?.createdAt) return "Chưa xác định";
    const base = new Date(order.createdAt);
    const offset = order.orderStatus === "completed" || order.orderStatus === "delivered" ? 1 : 2;
    base.setDate(base.getDate() + offset);
    return `${dateText(base)} · 14:00 - 18:00`;
  }, [order]);

  const timeline = useMemo(() => {
    return buildOrderTimeline(order);
  }, [order]);

  const summaryBlocks = [
    {
      label: orderStatusInfo.label,
      value: money(total),
      sub:
        order?.paymentMethod === "VNPAY"
          ? order?.paymentStatus === "paid"
            ? "VNPay · Đã thanh toán"
            : "VNPay · Chưa thanh toán"
          : "COD · Thanh toán khi nhận hàng",
      icon: Truck,
      accent: "success",
    },
    {
      label: "Vận chuyển bởi",
      value: delivery?.shipperId?.fullName || "Chưa có shipper nhận đơn",
      sub: delivery?.shipperId?.fullName
        ? `${shippingMethod} · Vận đơn: ${String(delivery?._id || "").slice(-6).toUpperCase()}`
        : shippingMethod,
      icon: Package,
      accent: "sky",
    },
    {
      label: "Ngày đặt hàng",
      value: orderDate,
      sub: `Lúc ${order?.createdAt ? new Date(order.createdAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) : "--:--"}`,
      icon: CalendarDays,
      accent: "muted",
    },
    {
      label: "Dự kiến nhận hàng",
      value: estimatedDelivery.split(" · ")[0],
      sub: estimatedDelivery.includes("·") ? estimatedDelivery.split(" · ")[1] : "Chưa xác định",
      icon: CheckCircle2,
      accent: order?.orderStatus === "cancelled" ? "danger" : "muted",
    },
  ];

  if (loading) {
    return (
      <EcoTradeLayout>
        <div className="flex min-h-[60vh] items-center justify-center text-sm font-medium text-on-surface-variant">
          Đang tải chi tiết đơn hàng...
        </div>
      </EcoTradeLayout>
    );
  }

  if (!order) {
    return (
      <EcoTradeLayout>
        <div className="rounded-3xl border border-surface-variant/50 bg-white px-6 py-10 text-center text-on-surface-variant shadow-apple">
          Không tìm thấy đơn hàng.
        </div>
      </EcoTradeLayout>
    );
  }

  return (
    <EcoTradeLayout>
      <div className="space-y-7 max-w-7xl mx-auto">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-start gap-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="mt-1 flex h-10 w-10 items-center justify-center rounded-full border border-surface-variant bg-white text-on-surface-variant transition-colors hover:bg-surface-container-low hover:text-on-surface"
              aria-label="Quay lại"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-[1.9rem] font-extrabold tracking-tight text-on-surface">
                  Chi tiết đơn hàng <span className="text-on-surface-variant/70">{trackCode}</span>
                </h1>
                <StatusChip tone={statusTone[order.orderStatus] || "muted"}>{orderStatusInfo.label}</StatusChip>
                {delivery ? <StatusChip tone={deliveryStatusInfo.variant || "muted"}>{deliveryStatusInfo.label}</StatusChip> : null}
              </div>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-on-surface-variant">
                Xem đầy đủ trạng thái đơn hàng, thông tin giao nhận, thanh toán và lịch sử vận chuyển.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <label className="flex h-11 w-[280px] items-center gap-2 rounded-full border border-[#edf0f3] bg-white px-4 shadow-[0_1px_2px_rgba(16,24,40,.03)]">
              <Search className="h-4 w-4 text-[#8a93a1]" />
              <input
                defaultValue={trackCode}
                className="w-full bg-transparent text-sm outline-none placeholder:text-[#a0a8b3]"
                placeholder="Tìm kiếm mã vận đơn..."
                readOnly
              />
            </label>
            <a
              href="mailto:support@ecotrade.vn"
              className="inline-flex h-11 items-center justify-center rounded-xl border border-[#dfe3e8] bg-white px-4 text-sm font-semibold text-[#202124] transition-colors hover:bg-[#f7f8fa]"
            >
              Hỗ trợ
            </a>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-4">
          {summaryBlocks.map((item) => (
            <InfoCard key={item.label} {...item} />
          ))}
        </div>

        {(order.cancelReason || delivery?.failureReason) && (
          <div className="rounded-3xl border border-danger/30 bg-danger-soft/50 p-6 text-black shadow-apple flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-danger text-white font-bold text-lg">
              ✕
            </div>
            <div>
              <div className="text-[13px] font-extrabold uppercase tracking-[0.12em] text-danger">Đơn hàng đã bị hủy / Giao thất bại</div>
              <div className="mt-1.5 text-base font-semibold leading-7 text-on-surface">
                {order.cancelReason || delivery?.failureReason}
              </div>
            </div>
          </div>
        )}

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_290px]">
          <div className="space-y-6">
            <SectionCard title="Danh sách sản phẩm" icon={PackageCheck}>
              <div className="overflow-hidden rounded-[16px] border border-[#eef1f4]">
                <div className="grid grid-cols-[minmax(0,1fr)_88px_120px_128px] border-b border-[#eef1f4] bg-[#fbfcfd] px-4 py-3 text-sm font-semibold text-[#667085]">
                  <div>Sản phẩm</div>
                  <div className="text-center">Số lượng</div>
                  <div className="text-right">Đơn giá</div>
                  <div className="text-right">Thành tiền</div>
                </div>
                <div className="divide-y divide-[#eef1f4]">
                  <div className="grid grid-cols-[minmax(0,1fr)_88px_120px_128px] items-center gap-4 px-4 py-4">
                    <div className="flex min-w-0 items-center gap-4">
                      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-surface-container-high">
                        {product.images?.[0] ? (
                          <img src={product.images[0]} alt={product.title || "Sản phẩm"} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-on-surface-variant/50">
                            <Package className="h-6 w-6" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-[1.02rem] font-bold text-on-surface">{product.title || "Sản phẩm EcoTrade"}</div>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-on-surface-variant">
                          <span className="font-semibold uppercase tracking-[0.12em]">SKU</span>
                          <span>{String(product._id || order.postId || "").slice(-10).toUpperCase()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-center text-sm font-semibold text-on-surface">x{order.quantity || 1}</div>
                    <div className="text-right text-sm font-semibold text-on-surface">{money(order.productPrice)}</div>
                    <div className="text-right text-sm font-bold text-primary">{money(subtotal)}</div>
                  </div>
                </div>
              </div>
            </SectionCard>

            <div className="grid gap-6 lg:grid-cols-2">
              <PartyCard
                title="Thông tin người mua"
                name={order.recipientName || order.buyerId?.fullName || "Người mua"}
                subtitle={isBuyerView ? "Bạn đang xem dưới vai trò người mua" : "Người đặt đơn hàng"}
                fallback={initials(order.recipientName || order.buyerId?.fullName) || "KH"}
                phone={order.buyerPhone || order.buyerId?.phone}
                email={order.buyerId?.email}
                address={order.buyerAddress}
              />
              <PartyCard
                title="Thông tin người bán"
                name={order.sellerId?.fullName || "Người bán"}
                subtitle={order.sellerId?.accountStatus === "active" ? "Tài khoản hoạt động" : "Trạng thái không xác định"}
                fallback={initials(order.sellerId?.fullName) || "NB"}
                meta={delivery?.shipperId?.fullName ? `Đang xử lý bởi ${delivery.shipperId.fullName}` : "Chưa gán shipper"}
                phone={order.sellerId?.phone}
                email={order.sellerId?.email}
                address={order.sellerId?.address}
              />
            </div>

            <SectionCard title="Lịch sử giao hàng" icon={Truck}>
              <div className="space-y-7">
                {timeline.length ? (
                  timeline.map((step, index) => {
                    const isLast = index === timeline.length - 1;
                    const tone = step.tone || "muted";
                    const lineTone =
                      tone === "danger" ? "bg-danger/30" : tone === "sky" ? "bg-sky/30" : tone === "warning" ? "bg-warning/30" : "bg-surface-variant";

                    return (
                      <div key={step.key} className="relative flex gap-4">
                        {!isLast ? <div className={`absolute left-[13px] top-7 h-[calc(100%+28px)] w-px ${lineTone}`} /> : null}
                        <div className={`relative mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 ${chipClass[tone] || chipClass.muted}`}>
                          <div className="h-2.5 w-2.5 rounded-full bg-current" />
                        </div>
                        <div className="pb-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="text-sm font-bold text-on-surface">{step.title}</div>
                            <StatusChip tone={step.timestamp ? tone : "muted"}>{dateTimeText(step.timestamp)}</StatusChip>
                          </div>
                          <p className={`mt-1 text-sm leading-6 ${step.key === "cancelled" ? "text-black" : "text-on-surface-variant"}`}>
                            {step.description}
                          </p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-8 text-sm text-[#667085]">Chưa có lịch sử giao hàng.</div>
                )}
              </div>
            </SectionCard>
          </div>

          <div className="space-y-6">
            <SectionCard title="Tóm tắt thanh toán" icon={CheckCircle2}>
              <div className="space-y-4 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-on-surface-variant">Tiền hàng (<span className="whitespace-nowrap">{order.quantity || 1} sản phẩm</span>)</span>
                  <span className="font-semibold text-on-surface whitespace-nowrap">{money(subtotal)}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-on-surface-variant whitespace-nowrap">Phí vận chuyển</span>
                  <span className="font-semibold text-on-surface whitespace-nowrap">{money(shippingFee)}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-on-surface-variant whitespace-nowrap">Giảm giá vận chuyển</span>
                  <span className="font-semibold text-danger whitespace-nowrap">-0 đ</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-on-surface-variant whitespace-nowrap">Voucher từ shop</span>
                  <span className="font-semibold text-danger whitespace-nowrap">-0 đ</span>
                </div>
                <div className="border-t border-surface-variant/30 pt-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="text-lg font-extrabold text-on-surface">Tổng thanh toán</div>
                    <div className="text-xl md:text-2xl font-extrabold text-primary">{money(total)}</div>
                  </div>
                </div>

              </div>
            </SectionCard>

            <div className="rounded-[18px] border border-surface-variant/50 bg-white p-5 shadow-apple">
              {order?.actions?.canSellerConfirm ? (
                <div className="rounded-2xl border border-warning/35 bg-warning-soft/60 p-5 space-y-3 shadow-sm">
                  <div className="flex items-center gap-2 font-bold text-warning text-base">
                    <AlertTriangle className="h-5 w-5 shrink-0" />
                    <span>Đơn hàng mới - Cần bạn xác nhận</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-5 font-medium">
                    Khách hàng đã đặt mua sản phẩm này. Vui lòng xác nhận đơn để chuyển sang luồng Shipper đi lấy hàng, hoặc từ chối kèm lý do nếu không thể giao.
                  </p>
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => handleOrderAction("cancelled")}
                      disabled={processing}
                      className="flex h-11 w-full items-center justify-center rounded-xl border border-danger/30 bg-white px-3 text-sm font-bold text-danger transition-all hover:bg-danger-soft hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 shadow-sm"
                    >
                      {processing ? "Đang xử lý..." : "Từ chối đơn"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOrderAction("confirmed")}
                      disabled={processing}
                      className="flex h-11 w-full items-center justify-center rounded-xl bg-success px-3 text-sm font-bold text-white transition-all hover:bg-success/90 hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 shadow-md"
                    >
                      {processing ? "Đang xử lý..." : "Xác nhận đơn"}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={canComplete ? () => handleOrderAction("completed") : undefined}
                    disabled={!canComplete || processing}
                    className="flex h-12 w-full items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-on-primary transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {processing && canComplete ? "Đang xử lý..." : "Xác nhận đã nhận hàng"}
                  </button>

                  {isBuyerView && order?.orderStatus === "completed" && !hasReviewed && (
                    <button
                      type="button"
                      onClick={() => setShowReviewModal(true)}
                      className="mt-3 flex h-12 w-full items-center justify-center rounded-xl border border-primary/30 bg-primary/5 px-4 text-sm font-semibold text-primary transition-colors hover:bg-primary/10"
                    >
                      Đánh giá sản phẩm
                    </button>
                  )}

                  {hasReviewed && (
                    <div className="mt-3 text-center text-sm font-medium text-success bg-success/5 rounded-xl py-3 border border-success/20">
                      Bạn đã đánh giá đơn hàng này
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      if (canTrackDelivery) {
                        toast("Đơn hàng đang được theo dõi trong hệ thống vận chuyển.");
                      } else {
                        toast("Đơn hàng chưa có vận đơn.");
                      }
                    }}
                    className="mt-3 flex h-12 w-full items-center justify-center rounded-xl border border-sky/30 bg-white px-4 text-sm font-semibold text-sky transition-colors hover:bg-sky-soft"
                  >
                    Theo dõi đơn vị vận chuyển
                  </button>

                  <div className="mt-5 border-t border-surface-variant/30 pt-5">
                    <p className="text-center text-xs leading-6 text-on-surface-variant">
                      Chỉ xác nhận sau khi bạn đã kiểm tra hàng. Sau khi xác nhận, yêu cầu trả hàng/hoàn tiền sẽ bị khóa theo quy trình hiện tại.
                    </p>
                    <button
                      type="button"
                      onClick={() => handleOrderAction("cancelled")}
                      disabled={!canCancel || processing}
                      className="mt-5 flex h-12 w-full items-center justify-center rounded-xl border border-danger/30 bg-white px-4 text-sm font-semibold text-danger transition-colors hover:bg-danger-soft disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {processing && canCancel ? "Đang hủy..." : order?.actions?.canSellerReject ? "Từ chối đơn hàng" : "Hủy đơn hàng"}
                    </button>
                  </div>
                </>
              )}
            </div>

            <div className="rounded-[18px] border border-dashed border-surface-variant/70 bg-surface-container-lowest p-5 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-on-surface-variant shadow-sm border border-surface-variant/20">
                  <HelpCircle className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-on-surface">Gặp vấn đề với đơn hàng?</div>
                  <p className="mt-1 text-sm leading-6 text-on-surface-variant">Liên hệ với chúng tôi để được xử lý nhanh nhất.</p>
                  <a href="mailto:support@ecotrade.vn" className="mt-3 inline-block text-sm font-bold text-primary">
                    Trung tâm hỗ trợ 24/7
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showReviewModal && order && (
        <ReviewModal
          isOpen={showReviewModal}
          onClose={() => {
            setShowReviewModal(false);
            // Refresh the review status after closing
            const checkAgain = async () => {
              if (!order || !user) return;
              try {
                const myReviewsRes = await reviewService.getMyReviews();
                if (myReviewsRes.success) {
                  const hasReviewedThisOrder = myReviewsRes.data.some(
                    (r) => String(r.orderId) === String(order._id)
                  );
                  setHasReviewed(hasReviewedThisOrder);
                }
              } catch (e) {
                console.error("Error checking review status again:", e);
              }
            };
            checkAgain();
          }}
          orderId={order._id}
          postId={order.postId?._id || order.postId}
          reviewUserId={order.sellerId?._id || order.sellerId}
          onSuccess={async () => {
            // Refresh hasReviewed after successful review
            try {
              const myReviewsRes = await reviewService.getMyReviews();
              if (myReviewsRes.success) {
                const hasReviewedThisOrder = myReviewsRes.data.some(
                  (r) => String(r.orderId) === String(order._id)
                );
                setHasReviewed(hasReviewedThisOrder);
              }
            } catch (e) {
              console.error("Error checking review status after success:", e);
            }
          }}
        />
      )}
    </EcoTradeLayout>
  );
}
