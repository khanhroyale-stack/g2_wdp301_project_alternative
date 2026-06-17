import { useEffect, useState } from "react";
import { Clock3, MapPin, Package2, Phone, Truck } from "lucide-react";
import { Link } from "react-router-dom";
import EcoTradeLayout from "../../components/ecotrade/EcoTradeLayout";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import deliveryService from "../../services/delivery.service";

const config = {
  available: { title: "Chờ nhận", filterCount: "2" },
  my: { title: "Đang giao", filterCount: "2" },
};

export default function DeliveryList() {
  const [tab, setTab] = useState("available");
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDeliveries = async () => {
      setLoading(true);
      try {
        const res = tab === "available" ? await deliveryService.getAvailableDeliveries() : await deliveryService.getMyDeliveries();
        if (res.success) setDeliveries(res.data);
      } finally {
        setLoading(false);
      }
    };

    fetchDeliveries();
  }, [tab]);

  const handleAcceptDelivery = async (id) => {
    try {
      const res = await deliveryService.acceptDelivery(id);
      if (res.success) {
        const refreshed = await deliveryService.getAvailableDeliveries();
        if (refreshed.success) setDeliveries(refreshed.data);
      }
    } catch (error) {
      alert(error.response?.data?.message || "Không thể nhận đơn giao");
    }
  };

  return (
    <EcoTradeLayout>
      <div className="w-full">
        <div className="mb-8 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-[3rem]">Quản lý giao hàng</h1>
            <p className="mt-3 text-xl text-muted-foreground">Theo dõi và cập nhật trạng thái các đơn hàng bạn đang phụ trách.</p>
          </div>
          <Card className="min-w-[248px] rounded-[22px]">
            <CardContent className="flex items-stretch gap-3 p-2">
              <div className="rounded-[18px] bg-success-soft px-5 py-3">
                <div className="text-sm font-bold uppercase tracking-[0.1em] text-success">Hiệu suất</div>
                <div className="text-[2rem] font-extrabold text-success">98%</div>
              </div>
              <div className="px-4 py-3">
                <div className="text-sm font-bold uppercase tracking-[0.1em] text-muted-foreground">Tháng này</div>
                <div className="text-[2rem] font-extrabold">124</div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="w-full justify-start overflow-auto rounded-[22px] p-2">
            <TabsTrigger value="available">Chờ nhận {tab === "available" ? config.available.filterCount : ""}</TabsTrigger>
            <TabsTrigger value="my">Đang giao {tab === "my" ? config.my.filterCount : ""}</TabsTrigger>
          </TabsList>
          <TabsContent value={tab}>
            {loading ? (
              <div className="py-20 text-center text-lg text-muted-foreground">Đang tải danh sách vận đơn...</div>
            ) : (
              <div className="grid gap-5 lg:grid-cols-2">
                {deliveries.map((delivery) => {
                  const order = delivery.orderId || {};
                  const counterpart = tab === "available" ? order.buyerId : order.sellerId;

                  return (
                    <Card key={delivery._id}>
                      <CardContent className="pt-6">
                        <div className="mb-5 flex items-start justify-between gap-4">
                          <div>
                            <div className="text-sm font-bold uppercase tracking-[0.12em] text-muted-foreground">Mã đơn hàng</div>
                            <div className="mt-1 text-[1.85rem] font-extrabold">{String(delivery._id).slice(-8).toUpperCase()}</div>
                          </div>
                          <Badge variant="warning">Chờ nhận</Badge>
                        </div>

                        <div className="space-y-4 border-t border-border pt-5">
                          <div className="flex items-center gap-4">
                            <div className="h-14 w-14 overflow-hidden rounded-full bg-muted">
                              {order.productImage ? <img src={order.productImage} alt={order.postId?.title} className="h-full w-full object-cover" /> : null}
                            </div>
                            <div>
                              <div className="text-[1.55rem] font-bold">{counterpart?.fullName || "Khách hàng EcoTrade"}</div>
                              <div className="mt-1 flex items-center gap-2 text-lg text-muted-foreground">
                                <Phone className="h-4 w-4" />
                                {counterpart?.phone || "Chưa có số điện thoại"}
                              </div>
                            </div>
                          </div>

                          <div className="space-y-3 text-lg text-muted-foreground">
                            <div className="flex items-start gap-3">
                              <MapPin className="mt-1 h-5 w-5 text-success" />
                              <span>{delivery.deliveryAddress || delivery.pickupAddress}</span>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2"><Package2 className="h-4 w-4" />{order.postId?.title ? "1 sản phẩm" : "0 sản phẩm"}</div>
                            <div className="flex items-center gap-2"><Clock3 className="h-4 w-4" />Cập nhật gần đây</div>
                          </div>
                        </div>

                        <div className="mt-5 flex gap-3 border-t border-border pt-5">
                          <Button asChild variant="outline" className="flex-1">
                            <Link to={`/deliveries/${delivery._id}`}>Xem chi tiết đơn hàng</Link>
                          </Button>
                          {tab === "available" ? (
                            <Button className="flex-1" onClick={() => handleAcceptDelivery(delivery._id)}>
                              Nhận đơn
                            </Button>
                          ) : (
                            <Button asChild variant="sky" className="flex-1">
                              <Link to={`/deliveries/${delivery._id}`}>
                                <Truck className="h-4 w-4" />
                                Mở vận đơn
                              </Link>
                            </Button>
                          )}
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
