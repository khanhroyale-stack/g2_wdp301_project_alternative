import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Archive, ArrowRight, CalendarDays, CircleAlert, Package2, ShoppingBag, Truck, UserRound } from "lucide-react";
import EcoTradeLayout from "../../components/ecotrade/EcoTradeLayout";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { getDeliveryStatusInfo, getOrderStatusInfo } from "../../lib/orderFlow";
import { formatDateTime, formatPrice } from "../../lib/utils";
import orderService from "../../services/order.service";

function getSellerActionHint(order) {
  if (order.actions?.canSellerConfirm) {
    return "Buyer da dat hang. Seller can xac nhan de tao delivery hoac tu choi truoc khi co shipper.";
  }

  if (order.orderStatus === "confirmed") {
    return "Don da duoc xac nhan. He thong dang cho shipper nhan va xu ly giao hang.";
  }

  if (order.orderStatus === "shipping") {
    return "Shipper da nhan don. Seller chi can theo doi tien do giao hang.";
  }

  if (order.orderStatus === "delivered" || order.orderStatus === "completed") {
    return "Shipper da giao xong. He thong dang cho buyer xac nhan hoan tat hoac da ket thuc giao dich.";
  }

  return "Don da bi huy va khong the xu ly tiep.";
}

export default function MySales() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await orderService.getMySales();
      if (res.success) setOrders(res.data);
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
        const reason = window.prompt("Nhap ly do tu choi/huy don", "");
        if (reason === null) {
          setProcessingId(null);
          return;
        }
        extra = { cancelReason: reason };
      }

      const res = await orderService.updateOrderStatus(orderId, status, extra);
      if (res.success) {
        await fetchOrders();
      }
    } catch (error) {
      alert(error.response?.data?.message || "Khong the cap nhat trang thai don hang");
    } finally {
      setProcessingId(null);
    }
  };

  const pendingCount = orders.filter((order) => order.orderStatus === "pending").length;
  const activeCount = orders.filter((order) => ["confirmed", "shipping", "delivered"].includes(order.orderStatus)).length;

  return (
    <EcoTradeLayout>
      <div className="w-full">
        <div className="mb-9 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-[3rem]">Don ban cua toi</h1>
            <p className="mt-3 text-xl text-muted-foreground">
              Trang seller chi hien thi cac don buyer da mua san pham cua ban va cac thao tac hop le theo trang thai.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Card className="min-w-[220px] border-warning/30 bg-[#fffaf1]">
              <CardContent className="pt-6">
                <div className="text-sm font-bold uppercase tracking-[0.12em] text-warning">Cho xu ly</div>
                <div className="mt-2 text-[2rem] font-extrabold">{pendingCount}</div>
                <div className="text-sm text-muted-foreground">Don dang can seller xac nhan</div>
              </CardContent>
            </Card>
            <Card className="min-w-[220px] border-success/20 bg-[#f5fdf8]">
              <CardContent className="pt-6">
                <div className="text-sm font-bold uppercase tracking-[0.12em] text-success">Dang van hanh</div>
                <div className="mt-2 text-[2rem] font-extrabold">{activeCount}</div>
                <div className="text-sm text-muted-foreground">Don da xac nhan hoac dang giao</div>
              </CardContent>
            </Card>
            <Button asChild variant="outline" className="self-start">
              <Link to="/orders/my-orders">
                Xem don mua
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>

        <Card className="mb-6 border-sky/20 bg-[#f4faff]">
          <CardContent className="flex items-start gap-4 pt-6">
            <div className="rounded-2xl bg-sky-soft p-3 text-sky">
              <CircleAlert className="h-6 w-6" />
            </div>
            <div>
              <div className="text-lg font-bold">Quy trinh seller hien tai</div>
              <div className="mt-1 text-sm leading-7 text-muted-foreground">
                Seller duoc xac nhan hoac tu choi don khi don chua vao luong shipper. Sau khi da co delivery va shipper nhan,
                seller chi theo doi tien do.
              </div>
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <div className="py-20 text-center text-lg text-muted-foreground">Dang tai danh sach don ban...</div>
        ) : orders.length === 0 ? (
          <Card>
            <CardContent className="flex min-h-[280px] flex-col items-center justify-center gap-4 pt-6 text-center">
              <Archive className="h-10 w-10 text-muted-foreground" />
              <div className="text-2xl font-bold">Chua co don ban nao</div>
              <div className="max-w-md text-muted-foreground">
                Khi buyer mua san pham cua ban, don se xuat hien o day de ban xac nhan hoac theo doi giao hang.
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-5">
            {orders.map((order) => {
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
                          <span className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">Ma don</span>
                          <span className="text-xl font-extrabold">{String(order._id).slice(-8).toUpperCase()}</span>
                          <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-2"><CalendarDays className="h-4 w-4" />{formatDateTime(order.createdAt)}</span>
                          <span className="flex items-center gap-2"><UserRound className="h-4 w-4" />Nguoi mua: {buyer.fullName || "N/A"}</span>
                        </div>
                      </div>
                      <Button asChild variant="outline">
                        <Link to={`/orders/${order._id}`}>Xem chi tiet</Link>
                      </Button>
                    </div>

                    <div className="flex flex-col gap-5 border-y border-border py-5 lg:flex-row">
                      <div className="h-24 w-24 overflow-hidden rounded-[18px] bg-muted">
                        {order.productImage ? <img src={order.productImage} alt={product.title} className="h-full w-full object-cover" /> : null}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-[1.35rem] font-bold">{product.title || "San pham EcoTrade"}</h3>
                        <div className="mt-3 flex flex-wrap gap-5 text-sm text-muted-foreground">
                          <span className="flex items-center gap-2"><ShoppingBag className="h-4 w-4" />Gia tri don: {formatPrice(order.totalAmount)}</span>
                          <span className="flex items-center gap-2"><Truck className="h-4 w-4" /><Badge variant={deliveryInfo.variant}>{deliveryInfo.label}</Badge></span>
                          <span className="flex items-center gap-2"><Package2 className="h-4 w-4" />Shipper: {order.delivery?.shipperId?.fullName || "Chua co shipper nhan don"}</span>
                        </div>
                        <div className="mt-4 rounded-2xl bg-muted px-4 py-3 text-sm text-muted-foreground">
                          {getSellerActionHint(order)}
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                      <div className="text-sm text-muted-foreground">
                        Dia chi nguoi mua: <span className="font-medium text-foreground">{order.buyerAddress || "Chua cap nhat"}</span>
                      </div>
                      {isPendingAction ? (
                        <div className="flex flex-wrap gap-3">
                          <Button
                            variant="danger"
                            disabled={isProcessing}
                            onClick={() => handleStatusUpdate(order._id, "cancelled")}
                          >
                            {isProcessing ? "Dang xu ly..." : "Tu choi don"}
                          </Button>
                          <Button
                            disabled={isProcessing}
                            onClick={() => handleStatusUpdate(order._id, "confirmed")}
                          >
                            {isProcessing ? "Dang xu ly..." : "Xac nhan don"}
                          </Button>
                        </div>
                      ) : (
                        <div className="text-sm font-medium text-muted-foreground">Khong co thao tac seller o trang thai hien tai</div>
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
