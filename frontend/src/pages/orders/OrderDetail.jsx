import { useCallback, useEffect, useState } from "react";
import { Clock3, Package, ShoppingBag, Truck, UserRoundSearch } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import EcoTradeLayout from "../../components/ecotrade/EcoTradeLayout";
import { Avatar, AvatarFallback } from "../../components/ui/avatar";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { useAuth } from "../../context/AuthContext";
import { buildOrderTimeline, getDeliveryStatusInfo, getOrderStatusInfo } from "../../lib/orderFlow";
import { formatDateTime, formatPrice } from "../../lib/utils";
import orderService from "../../services/order.service";

function PersonCard({ title, name, subtitle, fallback }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 pt-6">
        <Avatar className="h-14 w-14">
          <AvatarFallback>{fallback}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="text-xs font-bold uppercase tracking-[0.14em] text-success">{title}</div>
          <div className="truncate text-[1.5rem] font-bold">{name}</div>
          <div className="truncate text-base text-muted-foreground">{subtitle}</div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState(null);
  const [processing, setProcessing] = useState(false);

  const fetchOrder = useCallback(async () => {
    setLoading(true);
    try {
      const res = await orderService.getOrderById(id);
      if (res.success) {
        setOrder(res.data);
      }
    } catch (error) {
      alert(error.response?.data?.message || "Không thể tải thông tin đơn hàng");
      navigate(-1);
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

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
          setProcessing(false);
          return;
        }
        if (order?.actions?.canSellerReject && !reason.trim()) {
          alert("Vui lòng nhập lý do từ chối đơn hàng.");
          setProcessing(false);
          return;
        }
        extra = { cancelReason: reason.trim() };
      }

      const res = await orderService.updateOrderStatus(id, status, extra);
      if (res.success) {
        await fetchOrder();
      }
    } catch (error) {
      alert(error.response?.data?.message || "Không thể cập nhật đơn hàng");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <EcoTradeLayout>
        <div className="flex min-h-[70vh] items-center justify-center text-lg font-medium text-muted-foreground">
          Đang tải chi tiết đơn hàng...
        </div>
      </EcoTradeLayout>
    );
  }

  if (!order) {
    return null;
  }

  const product = order.postId || {};
  const delivery = order.delivery;
  const orderStatusInfo = getOrderStatusInfo(order.orderStatus);
  const deliveryStatusInfo = getDeliveryStatusInfo(delivery?.deliveryStatus);
  const timeline = buildOrderTimeline(order);
  const isBuyerView = order.actions?.isBuyer ?? String(order.buyerId?._id) === String(user?._id);
  const primaryActionLabel = order.actions?.canBuyerComplete
    ? "Đã nhận hàng"
    : order.actions?.canSellerConfirm
      ? "Xác nhận đơn"
      : null;

  return (
    <EcoTradeLayout>
      <div className="w-full">
        <div className="mb-8 flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-4">
              <h1 className="text-4xl font-extrabold tracking-tight sm:text-[3rem]">
                Chi tiết đơn hàng #{String(order._id).slice(-6).toUpperCase()}
              </h1>
              <Badge variant={orderStatusInfo.variant}>{orderStatusInfo.label}</Badge>
              {delivery ? <Badge variant={deliveryStatusInfo.variant}>{deliveryStatusInfo.label}</Badge> : null}
            </div>
            <div className="mt-3 flex items-center gap-2 text-xl text-muted-foreground">
              <Clock3 className="h-5 w-5" />
              Đặt lúc: {formatDateTime(order.createdAt)}
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            {order.actions?.canBuyerCancel || order.actions?.canSellerReject ? (
              <Button variant="danger" onClick={() => handleOrderAction("cancelled")} disabled={processing}>
                {processing
                  ? "Đang xử lý..."
                  : order.actions?.canSellerReject
                    ? "Từ chối đơn"
                    : "Hủy đơn"}
              </Button>
            ) : null}
            {primaryActionLabel ? (
              <Button
                onClick={() => handleOrderAction(order.actions?.canBuyerComplete ? "completed" : "confirmed")}
                disabled={processing}
              >
                {processing ? "Đang xử lý..." : primaryActionLabel}
              </Button>
            ) : null}
            <Button asChild>
              <Link to="/marketplaces">
                <ShoppingBag className="h-4 w-4" />
                Về marketplace
              </Link>
            </Button>
          </div>
        </div>

        <div className="mb-8 grid gap-5 xl:grid-cols-3">
          <PersonCard
            title="Người bán"
            name={order.sellerId?.fullName || "Seller"}
            subtitle={order.sellerId?.address || "Chưa cập nhật địa chỉ"}
            fallback="NB"
          />
          <PersonCard
            title="Người mua"
            name={order.buyerId?.fullName || "Buyer"}
            subtitle={order.buyerAddress || "Chưa cập nhật địa chỉ"}
            fallback="NM"
          />
          <PersonCard
            title="Shipper"
            name={delivery?.shipperId?.fullName || "Đang chờ phân công"}
            subtitle={delivery?.shipperId?.phone || "Hệ thống sẽ gán khi có người nhận"}
            fallback="SP"
          />
        </div>

        <div className="grid gap-7 xl:grid-cols-[minmax(0,1fr)_348px]">
          <div className="space-y-7">
            <div>
              <div className="flex items-center gap-3 text-[2rem] font-extrabold">
                <Truck className="h-6 w-6 text-success" />
                Hành trình đơn hàng
              </div>
              <p className="mt-2 text-xl text-muted-foreground">
                {isBuyerView
                  ? "Theo dõi các mốc xử lý và giao hàng của đơn mua."
                  : "Theo dõi các mốc seller cần giám sát từ lúc nhận đơn đến khi hoàn tất."}
              </p>
            </div>

            <Card>
              <CardContent className="pt-8">
                <div className="space-y-8">
                  {timeline.map((step, index) => (
                    <div key={`${step.kind}-${index}-${step.label}`} className="relative flex gap-4 pl-2">
                      {index < timeline.length - 1 ? (
                        <div className="absolute left-[21px] top-11 h-[calc(100%+18px)] w-px bg-success" />
                      ) : null}
                      <div className="relative mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-success bg-success text-white">
                        <div className="h-2.5 w-2.5 rounded-full bg-white" />
                      </div>
                      <div className="pb-1">
                        <div className="flex flex-wrap items-center gap-3 text-[1.15rem] font-bold text-foreground">
                          <span>{step.label}</span>
                          <Badge variant="outline" className="font-medium normal-case">
                            {formatDateTime(step.timestamp)}
                          </Badge>
                        </div>
                        <p className="mt-1 text-lg text-muted-foreground">
                          {step.note || "Cập nhật trạng thái đơn hàng."}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-[2rem]">Tóm tắt đơn hàng</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="flex gap-4 border-b border-border pb-5">
                  <div className="h-16 w-16 overflow-hidden rounded-[18px] bg-muted">
                    {product.images?.[0] ? (
                      <img src={product.images[0]} alt={product.title} className="h-full w-full object-cover" />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[1.2rem] font-bold">{product.title || "Sản phẩm EcoTrade"}</div>
                    <div className="text-base text-muted-foreground">SL: {order.quantity || 1}</div>
                    <div className="mt-1 text-[1.45rem] font-extrabold text-success">{formatPrice(order.productPrice)}</div>
                  </div>
                </div>
                <div className="space-y-3 text-[1.05rem]">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tạm tính:</span>
                    <span>{formatPrice((order.productPrice || 0) * (order.quantity || 1))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Phí vận chuyển:</span>
                    <span>{formatPrice(order.shippingFee)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Thanh toán:</span>
                    <span>COD</span>
                  </div>
                </div>
                <div className="flex items-center justify-between border-t border-border pt-4">
                  <span className="text-[1.3rem] font-bold">Tổng cộng:</span>
                  <span className="text-[2.1rem] font-extrabold text-success">{formatPrice(order.totalAmount)}</span>
                </div>
                {order.cancelReason ? (
                  <div className="rounded-2xl bg-danger-soft px-4 py-3 text-sm text-danger">
                    Lý do hủy đơn: {order.cancelReason}
                  </div>
                ) : null}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-[1.7rem]">
                  <UserRoundSearch className="h-5 w-5" />
                  Thông tin nhận hàng
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-[1.02rem]">
                <div>
                  <div className="text-sm font-bold uppercase tracking-[0.12em] text-muted-foreground">Người nhận</div>
                  <div className="mt-1">{order.recipientName}</div>
                </div>
                <div>
                  <div className="text-sm font-bold uppercase tracking-[0.12em] text-muted-foreground">Địa chỉ</div>
                  <div className="mt-1 leading-7">{order.buyerAddress}</div>
                </div>
                <div>
                  <div className="text-sm font-bold uppercase tracking-[0.12em] text-muted-foreground">Số điện thoại</div>
                  <div className="mt-1">{order.buyerPhone}</div>
                </div>
                <div>
                  <div className="text-sm font-bold uppercase tracking-[0.12em] text-muted-foreground">Ghi chú</div>
                  <div className="mt-1">{order.note || "Không có ghi chú"}</div>
                </div>
                {delivery?.failureReason ? (
                  <div>
                    <div className="text-sm font-bold uppercase tracking-[0.12em] text-danger">Sự cố delivery</div>
                    <div className="mt-1 text-danger">{delivery.failureReason}</div>
                  </div>
                ) : null}
              </CardContent>
            </Card>

            {delivery ? (
              <Card className="border-success/20 bg-[#f5fdf8]">
                <CardContent className="pt-6">
                  <div className="text-sm font-bold uppercase tracking-[0.12em] text-success">Delivery</div>
                  <div className="mt-2 text-[1.5rem] font-extrabold">{deliveryStatusInfo.label}</div>
                  <div className="mt-2 text-sm text-muted-foreground">
                    {delivery.shipperId
                      ? `Shipper: ${delivery.shipperId.fullName}`
                      : "Hệ thống đang chờ shipper nhận đơn."}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-warning/20 bg-[#fffaf1]">
                <CardContent className="pt-6">
                  <div className="text-sm font-bold uppercase tracking-[0.12em] text-warning">Delivery</div>
                  <div className="mt-2 text-[1.35rem] font-extrabold">Chưa tạo delivery</div>
                  <div className="mt-2 text-sm text-muted-foreground">
                    Seller cần xác nhận đơn trước khi hệ thống đưa đơn sang luồng shipper.
                  </div>
                </CardContent>
              </Card>
            )}

            {!isBuyerView && order.actions?.canSellerConfirm ? (
              <Card className="border-sky/20 bg-[#f4faff]">
                <CardContent className="pt-6">
                  <div className="mb-2 flex items-center gap-2 text-[1.1rem] font-bold">
                    <Package className="h-5 w-5 text-sky" />
                    Hành động của seller
                  </div>
                  <p className="text-sm leading-7 text-muted-foreground">
                    Xác nhận để tạo delivery chờ shipper nhận đơn, hoặc từ chối nếu bạn không thể xử lý đơn này.
                  </p>
                </CardContent>
              </Card>
            ) : null}
          </div>
        </div>
      </div>
    </EcoTradeLayout>
  );
}
