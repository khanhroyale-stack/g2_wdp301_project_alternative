import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Archive, CalendarDays, Package2, UserRound } from "lucide-react";
import EcoTradeLayout from "../../components/ecotrade/EcoTradeLayout";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import orderService from "../../services/order.service";
import { formatDateTime, formatPrice } from "../../lib/utils";

const statusMap = {
  pending: { label: "Chờ xác nhận", variant: "warning" },
  confirmed: { label: "Đã xác nhận", variant: "success" },
  shipping: { label: "Đang giao", variant: "sky" },
  delivered: { label: "Đã giao", variant: "success" },
  completed: { label: "Hoàn thành", variant: "success" },
  cancelled: { label: "Đã hủy", variant: "danger" },
};

export default function OrderList() {
  const [tab, setTab] = useState("buyer");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const res = tab === "buyer" ? await orderService.getMyOrders() : await orderService.getMySales();
        if (res.success) setOrders(res.data);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [tab]);

  return (
    <EcoTradeLayout>
      <div className="w-full">
        <div className="mb-9">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-[3rem]">Quản lý đơn hàng</h1>
          <p className="mt-3 text-xl text-muted-foreground">Theo dõi các đơn mua và đơn bán của bạn trong cùng một giao diện thống nhất.</p>
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="w-full justify-start overflow-auto rounded-[22px] p-2">
            <TabsTrigger value="buyer">Đơn mua</TabsTrigger>
            <TabsTrigger value="seller">Đơn bán</TabsTrigger>
          </TabsList>
          <TabsContent value={tab}>
            {loading ? (
              <div className="py-20 text-center text-lg text-muted-foreground">Đang tải danh sách đơn hàng...</div>
            ) : orders.length === 0 ? (
              <Card>
                <CardContent className="flex min-h-[280px] flex-col items-center justify-center gap-4 pt-6 text-center">
                  <Archive className="h-10 w-10 text-muted-foreground" />
                  <div className="text-2xl font-bold">Chưa có đơn hàng nào</div>
                  <div className="max-w-md text-muted-foreground">Khi có giao dịch mới, danh sách sẽ xuất hiện ở đây với trạng thái và hành động tương ứng.</div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-5">
                {orders.map((order) => {
                  const otherParty = tab === "buyer" ? order.sellerId : order.buyerId;
                  const product = order.postId || {};
                  const statusInfo = statusMap[order.orderStatus] || { label: order.orderStatus, variant: "muted" };

                  return (
                    <Card key={order._id}>
                      <CardContent className="pt-6">
                        <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <div>
                            <div className="mb-2 flex flex-wrap items-center gap-3">
                              <span className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">Mã đơn</span>
                              <span className="text-xl font-extrabold">{String(order._id).slice(-8).toUpperCase()}</span>
                              <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                            </div>
                            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-2"><CalendarDays className="h-4 w-4" />{formatDateTime(order.createdAt)}</span>
                              <span className="flex items-center gap-2"><UserRound className="h-4 w-4" />{tab === "buyer" ? "Người bán" : "Người mua"}: {otherParty?.fullName || "N/A"}</span>
                            </div>
                          </div>
                          <Button asChild variant="outline">
                            <Link to={`/orders/${order._id}`}>Xem chi tiết</Link>
                          </Button>
                        </div>

                        <div className="flex flex-col gap-5 border-y border-border py-5 sm:flex-row">
                          <div className="h-24 w-24 overflow-hidden rounded-[18px] bg-muted">
                            {order.productImage ? <img src={order.productImage} alt={product.title} className="h-full w-full object-cover" /> : null}
                          </div>
                          <div className="flex-1">
                            <h3 className="text-[1.35rem] font-bold">{product.title || "Sản phẩm EcoTrade"}</h3>
                            <p className="mt-1 text-base text-muted-foreground">Trạng thái giao hàng: {order.delivery?.deliveryStatus || "Chưa tạo vận đơn"}</p>
                            <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                              <Package2 className="h-4 w-4" />
                              <span>{order.delivery?.shipperId?.fullName || "Chưa có shipper nhận đơn"}</span>
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
          </TabsContent>
        </Tabs>
      </div>
    </EcoTradeLayout>
  );
}
