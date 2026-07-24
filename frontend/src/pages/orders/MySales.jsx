import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Archive,
  ArrowRight,
  BellRing,
  CalendarDays,
  Check,
  CircleAlert,
  CircleCheck,
  Clock,
  Leaf,
  Loader2,
  MapPin,
  Package2,
  ShoppingBag,
  Truck,
  UserRound,
  X,
} from "lucide-react";
import EcoTradeLayout from "../../components/ecotrade/EcoTradeLayout";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import useRealtimeRefresh from "../../hooks/useRealtimeRefresh";
import { getDeliveryStatusInfo, getOrderStatusInfo } from "../../lib/orderFlow";
import { formatDateTime, formatPrice } from "../../lib/utils";
import orderService from "../../services/order.service";

function getSellerActionHint(order) {
  if (order.actions?.canSellerConfirm) {
    return "Người mua đã đặt hàng. Bạn cần xác nhận hoặc từ chối đơn trước khi shipper tham gia.";
  }

  if (order.orderStatus === "confirmed") {
    return "Đơn đã được xác nhận. Hệ thống đang chờ shipper nhận đơn giao hàng.";
  }

  if (order.orderStatus === "shipping") {
    return "Shipper đã nhận đơn. Bạn chỉ cần theo dõi tiến độ giao hàng.";
  }

  if (order.orderStatus === "delivered" || order.orderStatus === "completed") {
    return order.orderStatus === "delivered"
      ? "Shipper đã xác nhận giao thành công. Hệ thống đang chờ buyer xác nhận nhận hàng; nếu buyer không xác nhận, đơn sẽ tự hoàn tất sau 3 ngày."
      : "Buyer đã xác nhận nhận hàng hoặc hệ thống đã tự hoàn tất sau thời gian chờ.";
  }

  return order.cancelReason
    ? `Đơn đã bị hủy. Lý do: ${order.cancelReason}`
    : "Đơn đã bị hủy và không thể xử lý tiếp.";
}

function getSellerConfirmStage(order) {
  if (order.orderStatus === "delivered") {
    return { label: "Shipper confirm", variant: "warning" };
  }

  if (order.orderStatus === "completed") {
    return { label: "Buyer confirm", variant: "success" };
  }

  return null;
}

function SalesSkeleton() {
  return (
    <div className="space-y-5">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="overflow-hidden rounded-card border border-border bg-surface shadow-card"
        >
          <div className="p-6">
            <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div className="space-y-3">
                <div className="h-6 w-48 animate-pulse rounded-btn bg-surface-secondary" />
                <div className="h-4 w-64 animate-pulse rounded-btn bg-surface-secondary" />
              </div>
              <div className="h-10 w-32 animate-pulse rounded-btn bg-surface-secondary" />
            </div>
            <div className="flex flex-col gap-5 border-y border-border py-5 lg:flex-row">
              <div className="h-24 w-24 shrink-0 animate-pulse rounded-image bg-surface-secondary" />
              <div className="flex-1 space-y-4">
                <div className="h-6 w-3/4 animate-pulse rounded-btn bg-surface-secondary" />
                <div className="flex gap-4">
                  <div className="h-4 w-32 animate-pulse rounded-btn bg-surface-secondary" />
                  <div className="h-4 w-40 animate-pulse rounded-btn bg-surface-secondary" />
                </div>
                <div className="h-14 w-full animate-pulse rounded-field bg-surface-secondary" />
              </div>
            </div>
            <div className="mt-5 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <div className="h-4 w-1/2 animate-pulse rounded-btn bg-surface-secondary" />
              <div className="flex gap-3">
                <div className="h-10 w-32 animate-pulse rounded-btn bg-surface-secondary" />
                <div className="h-10 w-32 animate-pulse rounded-btn bg-surface-secondary" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function MySales() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await orderService.getMySales();
      if (res.success) {
        setOrders(res.data);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);
  useRealtimeRefresh("order", fetchOrders);

  const handleStatusUpdate = async (orderId, status) => {
    setProcessingId(orderId);
    try {
      let extra = {};

      if (status === "cancelled") {
        const reason = window.prompt("Nhập lý do từ chối đơn hàng", "");
        if (reason === null) {
          setProcessingId(null);
          return;
        }
        if (!reason.trim()) {
          toast.error("Vui lòng nhập lý do từ chối đơn hàng.");
          setProcessingId(null);
          return;
        }
        extra = { cancelReason: reason.trim() };
      }

      const res = await orderService.updateOrderStatus(orderId, status, extra);
      if (res.success) {
        await fetchOrders();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Không thể cập nhật trạng thái đơn hàng");
    } finally {
      setProcessingId(null);
    }
  };

  const sortedOrders = useMemo(() => {
    const priority = {
      pending: 0,
      confirmed: 1,
      shipping: 2,
      delivered: 3,
      completed: 4,
      cancelled: 5,
    };

    return [...orders].sort((a, b) => {
      const aPriority = priority[a.orderStatus] ?? 99;
      const bPriority = priority[b.orderStatus] ?? 99;
      if (aPriority !== bPriority) {
        return aPriority - bPriority;
      }
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
  }, [orders]);

  const pendingCount = orders.filter((order) => order.orderStatus === "pending").length;
  const confirmedCount = orders.filter((order) => order.orderStatus === "confirmed").length;
  const shipperConfirmedCount = orders.filter((order) => order.orderStatus === "delivered").length;
  const buyerConfirmedCount = orders.filter((order) => order.orderStatus === "completed").length;

  const stats = [
    {
      label: "Đơn mới",
      value: pendingCount,
      hint: "Cần seller xử lý ngay",
      icon: BellRing,
      tone: "text-warning bg-warning-soft border-warning/25",
      iconTone: "bg-warning/15 text-warning",
    },
    {
      label: "Đã xác nhận",
      value: confirmedCount,
      hint: "Đang chờ shipper nhận đơn",
      icon: Clock,
      tone: "text-primary bg-surface-secondary border-primary/15",
      iconTone: "bg-primary/10 text-primary",
    },
    {
      label: "Shipper confirm",
      value: shipperConfirmedCount,
      hint: "Đã giao, chờ buyer xác nhận",
      icon: CircleCheck,
      tone: "text-success bg-success-soft border-success/20",
      iconTone: "bg-success-soft text-success",
    },
    {
      label: "Buyer confirm",
      value: buyerConfirmedCount,
      hint: "Buyer xác nhận hoặc tự hoàn tất",
      icon: CircleCheck,
      tone: "text-success bg-success-soft border-success/20",
      iconTone: "bg-success-soft text-success",
    },
  ];

  return (
    <EcoTradeLayout>
      <div className="w-full font-sans">
        <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-1.5 rounded-pill border border-border bg-surface px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-primary shadow-card">
              <Leaf className="h-3.5 w-3.5" />
              Kênh bán hàng
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
              Đơn bán của tôi
            </h1>
            <p className="mt-2 max-w-lg text-sm font-medium leading-relaxed text-muted-foreground">
              Seller nhận thông báo khi có đơn mới, bấm vào đơn để xác nhận hoặc từ chối kèm lý do, sau đó theo dõi quá trình giao hàng.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.label}
                  className={`rounded-card border p-4 shadow-card transition-all duration-200 ease-out hover:-translate-y-[3px] hover:shadow-card-hover ${stat.tone}`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`shrink-0 rounded-field p-2.5 ${stat.iconTone}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="min-h-[32px] text-[11px] font-bold uppercase tracking-[0.12em]">
                        {stat.label}
                      </div>
                      <div className="mt-1 text-[1.75rem] font-extrabold leading-none text-foreground">
                        {stat.value}
                      </div>
                      <div className="mt-1 text-xs font-medium text-muted-foreground">{stat.hint}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mb-5 rounded-card border border-border bg-surface p-5 shadow-card sm:p-6">
          <div className="flex items-start gap-4">
            <div className="rounded-field bg-primary/10 p-3 text-primary">
              <BellRing className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground sm:text-lg">Luồng seller hiện tại</h2>
              <p className="mt-1 text-sm font-medium leading-7 text-muted-foreground">
                Khi buyer đặt hàng, hệ thống tạo thông báo cho seller. Seller mở thông báo hoặc vào danh sách này để duyệt đơn,
                xác nhận tạo delivery hoặc từ chối có kèm lý do. Nếu đơn đã sang luồng shipper, seller chỉ theo dõi tiến độ.
              </p>
            </div>
          </div>
        </div>

        <div className="mb-6 rounded-card border border-warning/25 bg-warning-soft/60 p-5 shadow-card sm:p-6">
          <div className="flex items-start gap-4">
            <div className="rounded-field bg-warning/15 p-3 text-warning">
              <CircleAlert className="h-5 w-5" />
            </div>
            <p className="text-sm font-medium leading-7 text-muted-foreground">
              Trạng thái trong hệ thống đang dùng `pending`, `confirmed`, `shipping`, `delivered`, `completed`, `cancelled`.
              Về nghiệp vụ seller, bạn có thể hiểu lần lượt là chờ xác nhận, đã xác nhận, đang giao, đã giao, hoàn tất và đã hủy.
            </p>
          </div>
        </div>

        {loading ? (
          <SalesSkeleton />
        ) : sortedOrders.length === 0 ? (
          <div className="rounded-card border border-dashed border-border bg-surface shadow-card">
            <div className="flex min-h-[280px] flex-col items-center justify-center gap-4 px-6 py-12 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-card bg-success-soft">
                <Archive className="h-9 w-9 text-success" />
              </div>
              <h2 className="text-2xl font-extrabold text-foreground">Chưa có đơn bán nào</h2>
              <p className="max-w-md text-sm font-medium text-muted-foreground">
                Khi người mua đặt sản phẩm của bạn, đơn sẽ xuất hiện ở đây và bạn cũng sẽ nhận được thông báo để xử lý.
              </p>
              <Button
                asChild
                variant="outline"
                className="gap-2 rounded-btn transition-all duration-200 hover:-translate-y-[3px] hover:shadow-card"
              >
                <Link to="/notifications">
                  Mở trang thông báo
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {sortedOrders.map((order) => {
              const product = order.postId || {};
              const buyer = order.buyerId || {};
              const statusInfo = getOrderStatusInfo(order.orderStatus);
              const deliveryInfo = getDeliveryStatusInfo(order.delivery?.deliveryStatus);
              const isPendingAction = order.actions?.canSellerConfirm || order.actions?.canSellerReject;
              const isProcessing = processingId === order._id;
              const confirmStage = getSellerConfirmStage(order);

              return (
                <Card
                  key={order._id}
                  className="overflow-hidden rounded-card border-border shadow-card transition-all duration-200 ease-out hover:-translate-y-[3px] hover:border-primary/20 hover:shadow-card-hover"
                >
                  <CardContent className="pt-6">
                    <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                      <div>
                        <div className="mb-2 flex flex-wrap items-center gap-3">
                          <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted">
                            Mã đơn
                          </span>
                          <span className="rounded-field bg-surface-secondary px-2.5 py-1 text-lg font-extrabold tracking-wide text-foreground">
                            {String(order._id).slice(-8).toUpperCase()}
                          </span>
                          <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                          {confirmStage ? <Badge variant={confirmStage.variant}>{confirmStage.label}</Badge> : null}
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-muted-foreground">
                          <span className="flex items-center gap-2">
                            <CalendarDays className="h-4 w-4" />
                            {formatDateTime(order.createdAt)}
                          </span>
                          <span className="flex items-center gap-2">
                            <UserRound className="h-4 w-4" />
                            Người mua: {buyer.fullName || "Chưa cập nhật"}
                          </span>
                        </div>
                      </div>
                      <Button
                        asChild
                        variant="outline"
                        className="gap-2 rounded-btn transition-all duration-200 hover:-translate-y-[3px] hover:shadow-card focus-visible:ring-2 focus-visible:ring-primary/30"
                      >
                        <Link to={`/orders/${order._id}`}>
                          Xem chi tiết
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>

                    <div className="flex flex-col gap-5 border-y border-border py-5 lg:flex-row">
                      <div className="h-24 w-24 shrink-0 overflow-hidden rounded-image border border-border bg-surface-secondary">
                        {order.productImage ? (
                          <img src={order.productImage} alt={product.title} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-muted">
                            <Archive className="h-8 w-8" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-foreground sm:text-[1.25rem]">
                          {product.title || "Sản phẩm EcoTrade"}
                        </h3>
                        <div className="mt-3 flex flex-wrap gap-5 text-sm font-medium text-muted-foreground">
                          <span className="flex items-center gap-2">
                            <ShoppingBag className="h-4 w-4" />
                            Giá trị đơn: {formatPrice(order.totalAmount)}
                          </span>
                          <span className="flex items-center gap-2">
                            <Truck className="h-4 w-4" />
                            <Badge variant={deliveryInfo.variant}>{deliveryInfo.label}</Badge>
                          </span>
                          <span className="flex items-center gap-2">
                            <Package2 className="h-4 w-4" />
                            Shipper: {order.delivery?.shipperId?.fullName || "Chưa có shipper nhận đơn"}
                          </span>
                        </div>
                        <div
                          className={`mt-4 flex items-start gap-2 rounded-field bg-surface-secondary px-4 py-3 text-sm font-medium leading-6 ${
                            order.orderStatus === "cancelled" ? "text-foreground" : "text-muted-foreground"
                          }`}
                        >
                          <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
                          <span>{getSellerActionHint(order)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <MapPin className="h-4 w-4 shrink-0" />
                        Địa chỉ người mua:{" "}
                        <span className="font-semibold text-foreground">{order.buyerAddress || "Chưa cập nhật"}</span>
                      </div>
                      {isPendingAction ? (
                        <div className="flex flex-wrap gap-3">
                          <Button
                            variant="danger"
                            disabled={isProcessing}
                            onClick={() => handleStatusUpdate(order._id, "cancelled")}
                            className="gap-2 rounded-btn transition-all duration-200 hover:-translate-y-[3px] active:scale-[0.98] disabled:translate-y-0 disabled:opacity-50"
                          >
                            {isProcessing ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Đang xử lý...
                              </>
                            ) : (
                              <>
                                <X className="h-4 w-4" />
                                Từ chối đơn
                              </>
                            )}
                          </Button>
                          <Button
                            disabled={isProcessing}
                            onClick={() => handleStatusUpdate(order._id, "confirmed")}
                            className="gap-2 rounded-btn transition-all duration-200 hover:bg-primary-hover hover:-translate-y-[3px] active:scale-[0.98] disabled:translate-y-0 disabled:opacity-50"
                          >
                            {isProcessing ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Đang xử lý...
                              </>
                            ) : (
                              <>
                                <Check className="h-4 w-4" />
                                Xác nhận đơn
                              </>
                            )}
                          </Button>
                        </div>
                      ) : null}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </EcoTradeLayout>
  );
}
