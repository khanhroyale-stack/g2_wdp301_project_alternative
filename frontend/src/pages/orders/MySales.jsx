import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Archive,
  ArrowRight,
  BellRing,
  CalendarDays,
  CircleAlert,
  Package2,
  ShoppingBag,
  Truck,
  UserRound,
} from "lucide-react";
import EcoTradeLayout from "../../components/ecotrade/EcoTradeLayout";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
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
    return "Đơn đã giao xong. Hệ thống đang chờ người mua xác nhận hoặc đã hoàn tất giao dịch.";
  }

  return order.cancelReason
    ? `Đơn đã bị hủy. Lý do: ${order.cancelReason}`
    : "Đơn đã bị hủy và không thể xử lý tiếp.";
}

export default function MySales() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await orderService.getMySales();
      if (res.success) {
        setOrders(res.data);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

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
          alert("Vui lòng nhập lý do từ chối đơn hàng.");
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
      alert(error.response?.data?.message || "Không thể cập nhật trạng thái đơn hàng");
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
  const completedCount = orders.filter((order) => ["delivered", "completed"].includes(order.orderStatus)).length;

  return (
    <EcoTradeLayout>
      <div className="w-full">
        <div className="mb-9 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-[3rem]">Đơn bán của tôi</h1>
            <p className="mt-3 text-xl text-muted-foreground">
              Seller nhận thông báo khi có đơn mới, bấm vào đơn để xác nhận hoặc từ chối kèm lý do, sau đó theo dõi quá trình giao hàng.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Card className="min-w-[210px] border-warning/30 bg-[#fffaf1]">
              <CardContent className="pt-6">
                <div className="text-sm font-bold uppercase tracking-[0.12em] text-warning">Đơn mới</div>
                <div className="mt-2 text-[2rem] font-extrabold">{pendingCount}</div>
                <div className="text-sm text-muted-foreground">Cần seller xử lý ngay</div>
              </CardContent>
            </Card>
            <Card className="min-w-[210px] border-sky/20 bg-[#f4faff]">
              <CardContent className="pt-6">
                <div className="text-sm font-bold uppercase tracking-[0.12em] text-sky">Đã xác nhận</div>
                <div className="mt-2 text-[2rem] font-extrabold">{confirmedCount}</div>
                <div className="text-sm text-muted-foreground">Đang chờ shipper nhận đơn</div>
              </CardContent>
            </Card>
            <Card className="min-w-[210px] border-success/20 bg-[#f5fdf8]">
              <CardContent className="pt-6">
                <div className="text-sm font-bold uppercase tracking-[0.12em] text-success">Đã giao</div>
                <div className="mt-2 text-[2rem] font-extrabold">{completedCount}</div>
                <div className="text-sm text-muted-foreground">Đơn đã giao hoặc hoàn tất</div>
              </CardContent>
            </Card>
          </div>
        </div>

        <Card className="mb-6 border-sky/20 bg-[#f4faff]">
          <CardContent className="flex items-start gap-4 pt-6">
            <div className="rounded-2xl bg-sky-soft p-3 text-sky">
              <BellRing className="h-6 w-6" />
            </div>
            <div>
              <div className="text-lg font-bold">Luồng seller hiện tại</div>
              <div className="mt-1 text-sm leading-7 text-muted-foreground">
                Khi buyer đặt hàng, hệ thống tạo thông báo cho seller. Seller mở thông báo hoặc vào danh sách này để duyệt đơn,
                xác nhận tạo delivery hoặc từ chối có kèm lý do. Nếu đơn đã sang luồng shipper, seller chỉ theo dõi tiến độ.
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6 border-warning/20 bg-[#fffdf7]">
          <CardContent className="flex items-start gap-4 pt-6">
            <div className="rounded-2xl bg-warning/15 p-3 text-warning">
              <CircleAlert className="h-6 w-6" />
            </div>
            <div className="text-sm leading-7 text-muted-foreground">
              Trạng thái trong hệ thống đang dùng `pending`, `confirmed`, `shipping`, `delivered`, `completed`, `cancelled`.
              Về nghiệp vụ seller, bạn có thể hiểu lần lượt là chờ xác nhận, đã xác nhận, đang giao, đã giao, hoàn tất và đã hủy.
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <div className="py-20 text-center text-lg text-muted-foreground">Đang tải danh sách đơn bán...</div>
        ) : sortedOrders.length === 0 ? (
          <Card>
            <CardContent className="flex min-h-[280px] flex-col items-center justify-center gap-4 pt-6 text-center">
              <Archive className="h-10 w-10 text-muted-foreground" />
              <div className="text-2xl font-bold">Chưa có đơn bán nào</div>
              <div className="max-w-md text-muted-foreground">
                Khi người mua đặt sản phẩm của bạn, đơn sẽ xuất hiện ở đây và bạn cũng sẽ nhận được thông báo để xử lý.
              </div>
              <Button asChild variant="outline">
                <Link to="/notifications">
                  Mở trang thông báo
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-5">
            {sortedOrders.map((order) => {
              const product = order.postId || {};
              const buyer = order.buyerId || {};
              const statusInfo = getOrderStatusInfo(order.orderStatus);
              const deliveryInfo = getDeliveryStatusInfo(order.delivery?.deliveryStatus);
              const isPendingAction = order.actions?.canSellerConfirm || order.actions?.canSellerReject;
              const isProcessing = processingId === order._id;

              return (
                <Card key={order._id}>
                  <CardContent className="pt-6">
                    <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                      <div>
                        <div className="mb-2 flex flex-wrap items-center gap-3">
                          <span className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">Mã đơn</span>
                          <span className="text-xl font-extrabold">{String(order._id).slice(-8).toUpperCase()}</span>
                          <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
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
                      <Button asChild variant="outline">
                        <Link to={`/orders/${order._id}`}>Xem chi tiết</Link>
                      </Button>
                    </div>

                    <div className="flex flex-col gap-5 border-y border-border py-5 lg:flex-row">
                      <div className="h-24 w-24 overflow-hidden rounded-[18px] bg-muted">
                        {order.productImage ? (
                          <img src={order.productImage} alt={product.title} className="h-full w-full object-cover" />
                        ) : null}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-[1.35rem] font-bold">{product.title || "Sản phẩm EcoTrade"}</h3>
                        <div className="mt-3 flex flex-wrap gap-5 text-sm text-muted-foreground">
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
                        <div className="mt-4 rounded-2xl bg-muted px-4 py-3 text-sm text-muted-foreground">
                          {getSellerActionHint(order)}
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                      <div className="text-sm text-muted-foreground">
                        Địa chỉ người mua:{" "}
                        <span className="font-medium text-foreground">{order.buyerAddress || "Chưa cập nhật"}</span>
                      </div>
                      {isPendingAction ? (
                        <div className="flex flex-wrap gap-3">
                          <Button
                            variant="danger"
                            disabled={isProcessing}
                            onClick={() => handleStatusUpdate(order._id, "cancelled")}
                          >
                            {isProcessing ? "Đang xử lý..." : "Từ chối đơn"}
                          </Button>
                          <Button
                            disabled={isProcessing}
                            onClick={() => handleStatusUpdate(order._id, "confirmed")}
                          >
                            {isProcessing ? "Đang xử lý..." : "Xác nhận đơn"}
                          </Button>
                        </div>
                      ) : (
                        <div className="text-sm font-medium text-muted-foreground">
                          Không có thao tác seller ở trạng thái hiện tại
                        </div>
                      )}
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
