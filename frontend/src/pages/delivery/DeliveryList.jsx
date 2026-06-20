import { useEffect, useState } from "react";
import { Clock3, MapPin, Package2, Phone, Truck } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import EcoTradeLayout from "../../components/ecotrade/EcoTradeLayout";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { getDeliveryStatusInfo } from "../../lib/orderFlow";
import { formatDateTime } from "../../lib/utils";
import deliveryService from "../../services/delivery.service";

export default function DeliveryList() {
  const location = useLocation();
  const getTabFromPath = () => (location.pathname.includes("/dang-giao") ? "my" : "available");
  const [tab, setTab] = useState(getTabFromPath);
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTab(getTabFromPath());
  }, [location.pathname]);

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
        const refreshed = tab === "available" ? await deliveryService.getAvailableDeliveries() : await deliveryService.getMyDeliveries();
        if (refreshed.success) setDeliveries(refreshed.data);
      }
    } catch (error) {
      alert(error.response?.data?.message || "Khong the nhan don giao");
    }
  };

  return (
    <EcoTradeLayout>
      <div className="w-full">
        <div className="mb-8 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-[3rem]">Quan ly giao hang</h1>
            <p className="mt-3 text-xl text-muted-foreground">Theo doi va cap nhat tung buoc giao nhan cua cac don shipper dang phu trach.</p>
          </div>
          <Card className="min-w-[248px] rounded-[22px]">
            <CardContent className="flex items-stretch gap-3 p-2">
              <div className="rounded-[18px] bg-success-soft px-5 py-3">
                <div className="text-sm font-bold uppercase tracking-[0.1em] text-success">San sang</div>
                <div className="text-[2rem] font-extrabold text-success">{deliveries.length}</div>
              </div>
              <div className="px-4 py-3">
                <div className="text-sm font-bold uppercase tracking-[0.1em] text-muted-foreground">Che do</div>
                <div className="text-[2rem] font-extrabold">{tab === "available" ? "Moi" : "Dang xu ly"}</div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="w-full justify-start overflow-auto rounded-[22px] p-2">
            <TabsTrigger value="available">Cho nhan</TabsTrigger>
            <TabsTrigger value="my">Don cua toi</TabsTrigger>
          </TabsList>
          <TabsContent value={tab}>
            {loading ? (
              <div className="py-20 text-center text-lg text-muted-foreground">Dang tai danh sach van don...</div>
            ) : deliveries.length === 0 ? (
              <Card>
                <CardContent className="py-16 text-center text-muted-foreground">
                  {tab === "available" ? "Khong co don cho nhan." : "Ban chua co don dang giao."}
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-5 lg:grid-cols-2">
                {deliveries.map((delivery) => {
                  const order = delivery.orderId || {};
                  const counterpart = tab === "available" ? order.sellerId : order.buyerId;
                  const statusInfo = getDeliveryStatusInfo(delivery.deliveryStatus);

                  return (
                    <Card key={delivery._id}>
                      <CardContent className="pt-6">
                        <div className="mb-5 flex items-start justify-between gap-4">
                          <div>
                            <div className="text-sm font-bold uppercase tracking-[0.12em] text-muted-foreground">Ma van don</div>
                            <div className="mt-1 text-[1.85rem] font-extrabold">{String(delivery._id).slice(-8).toUpperCase()}</div>
                          </div>
                          <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                        </div>

                        <div className="space-y-4 border-t border-border pt-5">
                          <div className="flex items-center gap-4">
                            <div className="h-14 w-14 overflow-hidden rounded-full bg-muted">
                              {order.productImage ? <img src={order.productImage} alt={order.postId?.title} className="h-full w-full object-cover" /> : null}
                            </div>
                            <div>
                              <div className="text-[1.55rem] font-bold">{counterpart?.fullName || "EcoTrade"}</div>
                              <div className="mt-1 flex items-center gap-2 text-lg text-muted-foreground">
                                <Phone className="h-4 w-4" />
                                {counterpart?.phone || "Chua co so dien thoai"}
                              </div>
                            </div>
                          </div>

                          <div className="space-y-3 text-lg text-muted-foreground">
                            <div className="flex items-start gap-3">
                              <MapPin className="mt-1 h-5 w-5 text-success" />
                              <span>{tab === "available" ? delivery.pickupAddress : delivery.deliveryAddress}</span>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2"><Package2 className="h-4 w-4" />{order.postId?.title ? "1 san pham" : "0 san pham"}</div>
                            <div className="flex items-center gap-2"><Clock3 className="h-4 w-4" />{formatDateTime(delivery.updatedAt || delivery.createdAt)}</div>
                          </div>
                        </div>

                        <div className="mt-5 flex gap-3 border-t border-border pt-5">
                          <Button asChild variant="outline" className="flex-1">
                            <Link to={`/deliveries/${delivery._id}`}>Xem chi tiet</Link>
                          </Button>
                          {tab === "available" ? (
                            <Button className="flex-1" onClick={() => handleAcceptDelivery(delivery._id)}>
                              Nhan don
                            </Button>
                          ) : (
                            <Button asChild variant="sky" className="flex-1">
                              <Link to={`/deliveries/${delivery._id}`}>
                                <Truck className="h-4 w-4" />
                                Mo van don
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
