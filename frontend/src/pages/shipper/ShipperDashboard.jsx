import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2, CircleX, Clock3, Store, Truck } from "lucide-react";
import EcoTradeLayout from "../../components/ecotrade/EcoTradeLayout";
import { Card, CardContent } from "../../components/ui/card";
import deliveryService from "../../services/delivery.service";

const formatCurrency = (value) => `${(value || 0).toLocaleString("vi-VN")}d`;

const metrics = (availableCount, activeCount, completedCount, failedCount) => [
  { icon: Truck, label: "Cho nhan", value: availableCount, tone: "text-sky", bg: "bg-sky-soft" },
  { icon: Clock3, label: "Dang xu ly", value: activeCount, tone: "text-warning", bg: "bg-[#fff4df]" },
  { icon: CheckCircle2, label: "Hoan tat", value: completedCount, tone: "text-success", bg: "bg-success-soft" },
  { icon: CircleX, label: "That bai", value: failedCount, tone: "text-danger", bg: "bg-danger-soft" },
];

const ShipperDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [availableDeliveries, setAvailableDeliveries] = useState([]);
  const [myDeliveries, setMyDeliveries] = useState([]);

  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true);
      try {
        const [availableRes, mineRes] = await Promise.all([
          deliveryService.getAvailableDeliveries(),
          deliveryService.getMyDeliveries(),
        ]);

        if (availableRes.success) {
          setAvailableDeliveries(availableRes.data);
        }
        if (mineRes.success) {
          setMyDeliveries(mineRes.data);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  const activeDeliveries = myDeliveries.filter((delivery) =>
    ["accepted", "picking_up", "picked_up", "in_transit", "delivered"].includes(delivery.deliveryStatus)
  );
  const completedCount = myDeliveries.filter((delivery) => delivery.deliveryStatus === "completed").length;
  const failedCount = myDeliveries.filter((delivery) => delivery.deliveryStatus === "failed").length;

  return (
    <EcoTradeLayout>
      <div className="w-full font-sans">
        <div className="mb-9 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-[3rem]">Shipper hub</h1>
            <p className="mt-3 text-xl text-muted-foreground">
              Theo doi nhanh cac van don moi, nhung don dang di giao va ket qua xu ly cua ban.
            </p>
          </div>
          <Card className="border-success/20 bg-[#f5fdf8]">
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="rounded-2xl bg-success-soft p-3 text-success">
                <Store className="h-6 w-6" />
              </div>
              <div>
                <div className="text-lg font-bold">Luong giao hang da san sang</div>
                <div className="text-sm text-muted-foreground">Nhan don moi hoac mo ngay danh sach van don dang phu trach.</div>
              </div>
              <Link to="/shipper/don-can-giao" className="ml-auto inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
                Mo danh sach
                <ArrowRight className="h-4 w-4" />
              </Link>
            </CardContent>
          </Card>
        </div>

        <section className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {metrics(availableDeliveries.length, activeDeliveries.length, completedCount, failedCount).map((item) => (
            <Card key={item.label}>
              <CardContent className="flex items-center gap-4 pt-6">
                <div className={`rounded-2xl p-3 ${item.bg} ${item.tone}`}>
                  <item.icon className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-sm font-bold uppercase tracking-[0.12em] text-muted-foreground">{item.label}</div>
                  <div className="mt-1 text-[2rem] font-extrabold">{item.value}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </section>

        <Card>
          <CardContent className="pt-6">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <div className="text-lg font-bold">Don cho shipper nhan</div>
                <div className="text-sm text-muted-foreground">Danh sach nay den tu cac order seller da xac nhan va he thong da tao delivery.</div>
              </div>
              <Link to="/shipper/don-can-giao" className="text-sm font-semibold text-primary hover:underline">
                Xem tat ca
              </Link>
            </div>

            {loading ? (
              <div className="py-12 text-center text-muted-foreground">Dang tai du lieu shipper...</div>
            ) : availableDeliveries.length === 0 ? (
              <div className="rounded-2xl bg-muted px-6 py-12 text-center text-muted-foreground">
                Hien khong co don giao nao cho nhan.
              </div>
            ) : (
              <div className="space-y-4">
                {availableDeliveries.slice(0, 5).map((delivery) => {
                  const order = delivery.orderId || {};
                  return (
                    <div key={delivery._id} className="flex flex-col gap-4 rounded-[22px] border border-border p-5 lg:flex-row lg:items-center lg:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 text-sm font-bold uppercase tracking-[0.12em] text-muted-foreground">
                          Van don #{String(delivery._id).slice(-8).toUpperCase()}
                        </div>
                        <div className="text-[1.25rem] font-bold">{order.postId?.title || "Don giao hang EcoTrade"}</div>
                        <div className="mt-2 text-sm text-muted-foreground">
                          Tu {order.sellerId?.fullName || "Nguoi ban"} den {order.buyerId?.fullName || "Nguoi mua"}
                        </div>
                        <div className="mt-2 text-sm text-muted-foreground">{delivery.pickupAddress}</div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-sm text-muted-foreground">Phi giao</div>
                          <div className="text-[1.25rem] font-extrabold text-success">{formatCurrency(delivery.deliveryFee)}</div>
                        </div>
                        <Link to={`/deliveries/${delivery._id}`} className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-semibold hover:bg-muted">
                          Mo van don
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </EcoTradeLayout>
  );
};

export default ShipperDashboard;
