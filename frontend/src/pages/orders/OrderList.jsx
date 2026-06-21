import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Archive, ArrowRight, CalendarDays, Package2, Store, UserRound } from "lucide-react";
import EcoTradeLayout from "../../components/ecotrade/EcoTradeLayout";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { getDeliveryStatusInfo, getOrderStatusInfo } from "../../lib/orderFlow";
import { formatDateTime, formatPrice } from "../../lib/utils";
import orderService from "../../services/order.service";

export default function OrderList() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const res = await orderService.getMyOrders();
        if (res.success) setOrders(res.data);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  return (
    <EcoTradeLayout>
      <div className="w-full">
        <div className="mb-9 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-[3rem]">Don mua cua toi</h1>
            <p className="mt-3 text-xl text-muted-foreground">
              Theo doi cac don hang ban da dat, trang thai giao hang va thao tac buyer con co the thuc hien.
            </p>
          </div>
          <Card className="border-success/20 bg-[#f5fdf8]">
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="rounded-2xl bg-success-soft p-3 text-success">
                <Store className="h-6 w-6" />
              </div>
              <div>
                <div className="text-lg font-bold">Ban dang ban san pham?</div>
                <div className="text-sm text-muted-foreground">Mo trang seller de xem va xu ly don mua tu khach hang.</div>
              </div>
              <Button asChild variant="outline" className="ml-auto">
                <Link to="/orders/my-sales">
                  Di den Don ban
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {loading ? (
          <div className="py-20 text-center text-lg text-muted-foreground">Dang tai danh sach don hang...</div>
        ) : orders.length === 0 ? (
          <Card>
            <CardContent className="flex min-h-[280px] flex-col items-center justify-center gap-4 pt-6 text-center">
              <Archive className="h-10 w-10 text-muted-foreground" />
              <div className="text-2xl font-bold">Chua co don mua nao</div>
              <div className="max-w-md text-muted-foreground">
                Khi ban dat hang thanh cong, danh sach se xuat hien o day cung voi tien do xu ly va giao hang.
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-5">
            {orders.map((order) => {
              const product = order.postId || {};
              const seller = order.sellerId || {};
              const statusInfo = getOrderStatusInfo(order.orderStatus);
              const deliveryInfo = getDeliveryStatusInfo(order.delivery?.deliveryStatus);

              return (
                <Card key={order._id}>
                  <CardContent className="pt-6">
                    <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <div className="mb-2 flex flex-wrap items-center gap-3">
                          <span className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">Ma don</span>
                          <span className="text-xl font-extrabold">{String(order._id).slice(-8).toUpperCase()}</span>
                          <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                          {order.actions?.canBuyerComplete ? <Badge variant="success">Can xac nhan da nhan</Badge> : null}
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-2"><CalendarDays className="h-4 w-4" />{formatDateTime(order.createdAt)}</span>
                          <span className="flex items-center gap-2"><UserRound className="h-4 w-4" />Nguoi ban: {seller.fullName || "N/A"}</span>
                        </div>
                      </div>
                      <Button asChild variant="outline">
                        <Link to={`/orders/${order._id}`}>Xem chi tiet</Link>
                      </Button>
                    </div>

                    <div className="flex flex-col gap-5 border-y border-border py-5 sm:flex-row">
                      <div className="h-24 w-24 overflow-hidden rounded-[18px] bg-muted">
                        {order.productImage ? <img src={order.productImage} alt={product.title} className="h-full w-full object-cover" /> : null}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-[1.35rem] font-bold">{product.title || "San pham EcoTrade"}</h3>
                        <div className="mt-2 flex flex-wrap gap-3">
                          <Badge variant={deliveryInfo.variant}>{deliveryInfo.label}</Badge>
                          {order.actions?.canBuyerCancel ? <Badge variant="outline">Con the huy don</Badge> : null}
                        </div>
                        <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                          <Package2 className="h-4 w-4" />
                          <span>{order.delivery?.shipperId?.fullName || "Chua co shipper nhan don"}</span>
                        </div>
                      </div>
                      <div className="text-right text-[1.75rem] font-extrabold text-success">{formatPrice(order.totalAmount)}</div>
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
