import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  HelpCircle,
  Package,
  PackageCheck,
  Search,
  Truck,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import OrderWorkspace from "../../components/orders/OrderWorkspace";
import { useAuth } from "../../context/AuthContext";
import { getDeliveryStatusInfo, getOrderStatusInfo } from "../../lib/orderFlow";
import orderService from "../../services/order.service";

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
  success: "border-[#bdeed2] bg-[#ecfff4] text-[#12b85d]",
  sky: "border-[#b8d3ff] bg-[#eaf2ff] text-[#2463c5]",
  warning: "border-[#f6d66b] bg-[#fff8d9] text-[#9b6a00]",
  danger: "border-[#ffc5c5] bg-[#fff0f0] text-[#e74343]",
  muted: "border-[#e1e5e9] bg-[#f3f4f6] text-[#4e5968]",
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
    <section className={`rounded-[20px] border border-[#e6eaee] bg-white shadow-[0_1px_3px_rgba(16,24,40,.04)] ${className}`}>
      <div className="border-b border-[#eef1f4] px-6 py-5">
        <div className="flex items-center gap-3 text-[1.15rem] font-bold text-[#202124]">
          {Icon ? <Icon className="h-5 w-5 text-[#18c76b]" /> : null}
          <span>{title}</span>
        </div>
      </div>
      <div className="px-6 py-5">{children}</div>
    </section>
  );
}

function InfoCard({ label, value, sub, icon: Icon, accent = "success", className = "" }) {
  return (
    <div className={`rounded-[18px] border border-[#e6eaee] bg-white px-5 py-5 shadow-[0_1px_3px_rgba(16,24,40,.04)] ${className}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-[12px] font-bold uppercase tracking-[0.12em] text-[#76808f]">{label}</div>
          <div className="mt-2 text-[1.05rem] font-bold text-[#202124]">{value}</div>
          {sub ? <div className="mt-1 text-sm text-[#667085]">{sub}</div> : null}
        </div>
        {Icon ? (
          <div className={`rounded-full p-3 ${accent === "success" ? "bg-[#e9fff1] text-[#18c76b]" : accent === "sky" ? "bg-[#ecf4ff] text-[#3b82f6]" : accent === "warning" ? "bg-[#fff7df] text-[#f2a900]" : "bg-[#fff0f0] text-[#ff5353]"}`}>
            <Icon className="h-5 w-5" />
          </div>
        ) : null}
      </div>
    </div>
  );
}

function PartyCard({ title, name, subtitle, fallback, meta, phone, email, address }) {
  return (
    <div className="rounded-[18px] border border-[#e6eaee] bg-white p-5 shadow-[0_1px_3px_rgba(16,24,40,.04)]">
      <div className="flex items-center gap-3">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#f1f4f6] text-sm font-bold text-[#202124]">
          {fallback || initials(name) || "--"}
        </div>
        <div className="min-w-0">
          <div className="text-[12px] font-bold uppercase tracking-[0.12em] text-[#18c76b]">{title}</div>
          <div className="truncate text-[1.05rem] font-bold text-[#202124]">{name}</div>
          {subtitle ? <div className="truncate text-sm text-[#667085]">{subtitle}</div> : null}
          {meta ? <div className="truncate text-sm text-[#667085]">{meta}</div> : null}
        </div>
      </div>
      <div className="mt-5 space-y-4 border-t border-[#eef1f4] pt-4 text-sm">
        <div>
          <div className="mb-1 text-[11px] font-bold uppercase tracking-[0.12em] text-[#8a93a1]">Số điện thoại</div>
          <div className="text-[#202124]">{phone || "Chưa cập nhật"}</div>
        </div>
        <div>
          <div className="mb-1 text-[11px] font-bold uppercase tracking-[0.12em] text-[#8a93a1]">Email</div>
          <div className="text-[#202124]">{email || "Chưa cập nhật"}</div>
        </div>
        <div>
          <div className="mb-1 text-[11px] font-bold uppercase tracking-[0.12em] text-[#8a93a1]">Địa chỉ</div>
          <div className="leading-6 text-[#202124]">{address || "Chưa cập nhật"}</div>
        </div>
      </div>
    </div>
  );
}

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    let mounted = true;

    const fetchOrder = async () => {
      setLoading(true);
      try {
        const res = await orderService.getOrderById(id);
        if (mounted && res.success) {
          setOrder(res.data);
        }
      } catch (error) {
        toast.error(error.response?.data?.message || "Không thể tải chi tiết đơn hàng");
        navigate(-1);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchOrder();

    return () => {
      mounted = false;
    };
  }, [id, navigate]);

  const refreshOrder = async () => {
    const res = await orderService.getOrderById(id);
    if (res.success) {
      setOrder(res.data);
    }
  };

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
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Không thể cập nhật đơn hàng");
    } finally {
      setProcessing(false);
    }
  };

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
    if (!order) return [];

    const steps = [];
    const addStep = (key, title, description, timestamp, tone = "muted") => {
      if (!timestamp && !title) return;
      steps.push({
        key,
        title,
        description,
        timestamp,
        tone,
      });
    };

    addStep(
      "created",
      "Đã đặt hàng",
      "Đơn hàng đã được ghi nhận vào hệ thống.",
      order.createdAt,
      "success"
    );

    if (order.orderStatus === "pending") {
      addStep("pending", "Chờ lấy hàng", "Người bán chưa xác nhận đơn hàng.", order.updatedAt, "warning");
    }

    if (order.orderStatus === "confirmed") {
      addStep("confirmed", "Đã xác nhận", "Người bán đã xác nhận và chờ đơn vị vận chuyển.", order.updatedAt, "success");
    }

    const history = Array.isArray(delivery?.history) ? delivery.history : [];
    history.forEach((item) => {
      const info = getDeliveryStatusInfo(item.status);
      addStep(
        `delivery-${item.status}-${item.timestamp}`,
        info.label,
        item.note || "Cập nhật trạng thái giao hàng.",
        item.timestamp,
        item.status === "failed" ? "danger" : item.status === "delivered" || item.status === "completed" ? "success" : "sky"
      );
    });

    if (order.orderStatus === "shipping") {
      addStep("shipping", "Đang vận chuyển", "Đơn hàng đang trên đường giao đến người nhận.", order.updatedAt, "sky");
    }

    if (order.orderStatus === "delivered") {
      addStep("delivered", "Đang giao hàng", "Đơn hàng đã đến chặng giao cuối cùng.", order.updatedAt, "success");
    }

    if (order.orderStatus === "completed") {
      addStep("completed", "Đã giao hàng thành công", "Người mua đã xác nhận nhận hàng.", order.updatedAt, "success");
    }

    if (order.orderStatus === "cancelled") {
      addStep(
        "cancelled",
        "Đơn hàng đã hủy",
        order.cancelReason || "Đơn hàng đã được hủy và tồn kho đã được hoàn lại.",
        order.updatedAt,
        "danger"
      );
    }

    const seen = new Set();
    return steps
      .filter((step) => {
        const key = `${step.title}-${step.timestamp}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));
  }, [delivery?.history, order]);

  const summaryBlocks = [
    {
      label: orderStatusInfo.label,
      value: money(total),
      sub: order?.paymentMethod === "COD" ? "Đã thanh toán khi nhận hàng" : "Phương thức thanh toán khác",
      icon: Truck,
      accent: "success",
    },
    {
      label: "Vận chuyển bởi",
      value: shippingMethod,
      sub: delivery?.shipperId?.fullName ? `Vận đơn: ${String(delivery?._id || "").slice(-6).toUpperCase()}` : "Chưa phân công shipper",
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
      <OrderWorkspace>
        <div className="flex min-h-[60vh] items-center justify-center text-sm font-medium text-[#667085]">
          Đang tải chi tiết đơn hàng...
        </div>
      </OrderWorkspace>
    );
  }

  if (!order) {
    return (
      <OrderWorkspace>
        <div className="rounded-[18px] border border-[#e6eaee] bg-white px-6 py-10 text-center text-[#667085] shadow-[0_1px_3px_rgba(16,24,40,.04)]">
          Không tìm thấy đơn hàng.
        </div>
      </OrderWorkspace>
    );
  }

  return (
    <OrderWorkspace>
      <div className="space-y-7">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-start gap-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="mt-1 flex h-10 w-10 items-center justify-center rounded-full border border-[#dfe3e8] bg-white text-[#596576] transition-colors hover:bg-[#f7f8fa]"
              aria-label="Quay lại"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-[1.9rem] font-extrabold tracking-tight text-[#202124]">
                  Chi tiết đơn hàng <span className="text-[#667085]">{trackCode}</span>
                </h1>
                <StatusChip tone={statusTone[order.orderStatus] || "muted"}>{orderStatusInfo.label}</StatusChip>
                {delivery ? <StatusChip tone={deliveryStatusInfo.variant || "muted"}>{deliveryStatusInfo.label}</StatusChip> : null}
              </div>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-[#667085]">
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
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex h-11 items-center justify-center rounded-xl bg-[#18c76b] px-4 text-sm font-semibold text-[#062d18] transition-colors hover:bg-[#15b861]"
            >
              In hóa đơn
            </button>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-4">
          {summaryBlocks.map((item) => (
            <InfoCard key={item.label} {...item} />
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
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
                      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-[#f1f4f6]">
                        {product.images?.[0] ? (
                          <img src={product.images[0]} alt={product.title || "Sản phẩm"} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-[#a0a8b3]">
                            <Package className="h-6 w-6" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-[1.02rem] font-bold text-[#202124]">{product.title || "Sản phẩm EcoTrade"}</div>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[#667085]">
                          <span className="font-semibold uppercase tracking-[0.12em]">SKU</span>
                          <span>{String(product._id || order.postId || "").slice(-10).toUpperCase()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-center text-sm font-semibold text-[#202124]">x{order.quantity || 1}</div>
                    <div className="text-right text-sm font-semibold text-[#202124]">{money(order.productPrice)}</div>
                    <div className="text-right text-sm font-bold text-[#18c76b]">{money(subtotal)}</div>
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
                      tone === "danger" ? "bg-[#ffb3b3]" : tone === "sky" ? "bg-[#b8d3ff]" : tone === "warning" ? "bg-[#f6d66b]" : "bg-[#cfd6dd]";

                    return (
                      <div key={step.key} className="relative flex gap-4">
                        {!isLast ? <div className={`absolute left-[13px] top-8 h-[calc(100%+28px)] w-px ${lineTone}`} /> : null}
                        <div className={`relative mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 ${chipClass[tone] || chipClass.muted}`}>
                          <div className="h-2.5 w-2.5 rounded-full bg-current" />
                        </div>
                        <div className="pb-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="text-sm font-bold text-[#202124]">{step.title}</div>
                            <StatusChip tone={tone}>{dateTimeText(step.timestamp)}</StatusChip>
                          </div>
                          <p className="mt-1 text-sm leading-6 text-[#667085]">{step.description}</p>
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
                  <span className="text-[#667085]">Tiền hàng ({order.quantity || 1} sản phẩm)</span>
                  <span className="font-semibold text-[#202124]">{money(subtotal)}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[#667085]">Phí vận chuyển</span>
                  <span className="font-semibold text-[#202124]">{money(shippingFee)}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[#667085]">Giảm giá vận chuyển</span>
                  <span className="font-semibold text-[#e74343]">-0 đ</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[#667085]">Voucher từ shop</span>
                  <span className="font-semibold text-[#e74343]">-0 đ</span>
                </div>
                <div className="border-t border-[#eef1f4] pt-4">
                  <div className="flex items-end justify-between gap-3">
                    <div className="text-[1.35rem] font-extrabold text-[#202124]">Tổng thanh toán</div>
                    <div className="text-[1.6rem] font-extrabold text-[#18c76b]">{money(total)}</div>
                  </div>
                </div>
                <div className="rounded-2xl bg-[#f8fbff] px-4 py-4 text-sm text-[#667085]">
                  Bạn có thể tích lũy {money(total).replace(" đ", "")} điểm EcoTradePoints sau khi đơn hàng được xác nhận thành công.
                </div>
              </div>
            </SectionCard>

            <div className="rounded-[18px] border border-[#e6eaee] bg-white p-5 shadow-[0_1px_3px_rgba(16,24,40,.04)]">
              <button
                type="button"
                onClick={canComplete ? () => handleOrderAction("completed") : undefined}
                disabled={!canComplete || processing}
                className="flex h-12 w-full items-center justify-center rounded-xl bg-[#18c76b] px-4 text-sm font-semibold text-[#062d18] transition-colors hover:bg-[#15b861] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {processing && canComplete ? "Đang xử lý..." : "Xác nhận đã nhận hàng"}
              </button>

              <button
                type="button"
                onClick={() => {
                  if (canTrackDelivery) {
                    toast("Đơn hàng đang được theo dõi trong hệ thống vận chuyển.");
                  } else {
                    toast("Đơn hàng chưa có vận đơn.");
                  }
                }}
                className="mt-3 flex h-12 w-full items-center justify-center rounded-xl border border-[#7bc7ff] bg-white px-4 text-sm font-semibold text-[#2b8ff7] transition-colors hover:bg-[#f4fbff]"
              >
                Theo dõi đơn vị vận chuyển
              </button>

              <div className="mt-5 border-t border-[#eef1f4] pt-5">
                <p className="text-center text-xs leading-6 text-[#8a93a1]">
                  Chỉ xác nhận sau khi bạn đã kiểm tra hàng. Sau khi xác nhận, yêu cầu trả hàng/hoàn tiền sẽ bị khóa theo quy trình hiện tại.
                </p>
                <button
                  type="button"
                  onClick={() => handleOrderAction("cancelled")}
                  disabled={!canCancel || processing}
                  className="mt-5 flex h-12 w-full items-center justify-center rounded-xl border border-[#ffc5c5] bg-white px-4 text-sm font-semibold text-[#ff5555] transition-colors hover:bg-[#fff7f7] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {processing && canCancel ? "Đang hủy..." : "Hủy đơn hàng"}
                </button>
              </div>
            </div>

            <div className="rounded-[18px] border border-dashed border-[#d8dde4] bg-[#fcfdff] p-5 shadow-[0_1px_3px_rgba(16,24,40,.03)]">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-[#8a93a1] shadow-sm">
                  <HelpCircle className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-[#202124]">Gặp vấn đề với đơn hàng?</div>
                  <p className="mt-1 text-sm leading-6 text-[#667085]">Liên hệ với chúng tôi để được xử lý nhanh nhất.</p>
                  <a href="mailto:support@ecotrade.vn" className="mt-3 inline-block text-sm font-bold text-[#18c76b]">
                    Trung tâm hỗ trợ 24/7
                  </a>
                </div>
              </div>
            </div>

            {order.cancelReason ? (
              <div className="rounded-[18px] border border-[#ffc5c5] bg-[#fff7f7] p-5 text-sm text-[#e74343] shadow-[0_1px_3px_rgba(16,24,40,.03)]">
                <div className="font-bold uppercase tracking-[0.12em]">Lý do hủy đơn</div>
                <div className="mt-2 leading-6">{order.cancelReason}</div>
              </div>
            ) : null}

            {delivery?.failureReason ? (
              <div className="rounded-[18px] border border-[#ffc5c5] bg-[#fff7f7] p-5 text-sm text-[#e74343] shadow-[0_1px_3px_rgba(16,24,40,.03)]">
                <div className="font-bold uppercase tracking-[0.12em]">Sự cố giao hàng</div>
                <div className="mt-2 leading-6">{delivery.failureReason}</div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </OrderWorkspace>
  );
}
