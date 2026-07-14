import { useCallback, useEffect, useState } from "react";
import { Clock3, MapPin, Package2, Phone, Truck } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import ShipperLayout from "../../components/shipper/ShipperLayout";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { formatDateTime, formatPrice } from "../../lib/utils";
import deliveryService from "../../services/delivery.service";
import { getDeliveryStatusInfo } from "../../lib/orderFlow";
import toast from "react-hot-toast";

const ACTIVE_STATUSES = ["accepted", "picking_up", "picked_up", "ready_for_delivery", "received", "in_transit"];
const COMPLETED_STATUSES = ["delivered", "completed"];
const ISSUE_STATUSES = ["inspection_failed", "failed"];

const tabs = [
  { key: "new", label: "Đơn mới" },
  { key: "delivering", label: "Đang giao" },
  { key: "completed", label: "Hoàn thành" },
  { key: "issues", label: "Sự cố" },
];

const filterByTab = (items, tab) => {
  if (tab === "delivering") return items.filter((item) => ACTIVE_STATUSES.includes(item.deliveryStatus));
  if (tab === "completed") return items.filter((item) => COMPLETED_STATUSES.includes(item.deliveryStatus));
  if (tab === "issues") return items.filter((item) => ISSUE_STATUSES.includes(item.deliveryStatus));
  return items;
};

export default function DeliveryList() {
  const navigate = useNavigate();
  const [deliveries, setDeliveries] = useState([]);
  const [summary, setSummary] = useState({ new: 0, delivering: 0, completed: 0, issues: 0, income: 0 });
  const [loading, setLoading] = useState(true);
  const [acceptingId, setAcceptingId] = useState(null);
  const [view, setView] = useState("new");

  const fetchSummary = useCallback(async () => {
    const [availableRes, mineRes] = await Promise.all([
      deliveryService.getAvailableDeliveries(),
      deliveryService.getMyDeliveries(),
    ]);
    const available = availableRes.success ? availableRes.data : [];
    const mine = mineRes.success ? mineRes.data : [];
    const completed = filterByTab(mine, "completed");

    setSummary({
      new: available.length,
      delivering: filterByTab(mine, "delivering").length,
      completed: completed.length,
      issues: filterByTab(mine, "issues").length,
      income: completed.reduce((total, item) => total + Number(item.deliveryFee || 0), 0),
    });
  }, []);

  const fetchDeliveries = useCallback(async () => {
    setLoading(true);
    try {
      if (view === "new") {
        const res = await deliveryService.getAvailableDeliveries();
        if (res.success) setDeliveries(res.data);
      } else {
        const res = await deliveryService.getMyDeliveries();
        if (res.success) setDeliveries(filterByTab(res.data, view));
      }
    } finally {
      setLoading(false);
    }
  }, [view]);

  useEffect(() => {
    fetchDeliveries();
  }, [fetchDeliveries]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const handleAcceptDelivery = async (id) => {
    setAcceptingId(id);
    try {
      const res = await deliveryService.acceptDelivery(id);
      if (res.success) {
        await fetchSummary();
        navigate(`/shipper/don/${id}`);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Không thể nhận đơn giao.");
    } finally {
      setAcceptingId(null);
    }
  };

  return (
    <ShipperLayout>
      <div className="w-full">
        <div className="mb-8 rounded-[28px] border border-surface-variant/40 bg-[linear-gradient(135deg,#ffffff_0%,#eef8f1_100%)] p-7 shadow-apple">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <h1 className="page-title">Dashboard shipper</h1>
              <p className="page-subtitle">
                Theo dõi đơn mới, đơn đang giao, đơn hoàn thành và sự cố theo đúng luồng giao hàng.
              </p>
            </div>
            <div className="flex rounded-2xl border border-surface-variant/50 bg-white p-1.5 shadow-sm">
              {tabs.map((tab) => (
                <Button key={tab.key} variant={view === tab.key ? undefined : "ghost"} onClick={() => setView(tab.key)}>
                  {tab.label}
                </Button>
              ))}
            </div>
            <Card className="border-success/20 bg-[#f5fdf8]">
              <CardContent className="flex items-center gap-4 pt-6">
                <div className="rounded-2xl bg-success-soft p-3 text-success">
                  <Truck className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-sm font-bold uppercase tracking-[0.12em] text-success">Đơn trong tab</div>
                  <div className="mt-1 text-[2rem] font-extrabold text-on-surface">{deliveries.length}</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <Card className="panel-surface"><CardContent className="pt-5"><div className="text-sm font-bold text-on-surface-variant">Đơn mới</div><div className="mt-2 text-3xl font-extrabold">{summary.new}</div></CardContent></Card>
          <Card className="panel-surface"><CardContent className="pt-5"><div className="text-sm font-bold text-on-surface-variant">Đang giao</div><div className="mt-2 text-3xl font-extrabold">{summary.delivering}</div></CardContent></Card>
          <Card className="panel-surface"><CardContent className="pt-5"><div className="text-sm font-bold text-on-surface-variant">Hoàn thành</div><div className="mt-2 text-3xl font-extrabold">{summary.completed}</div></CardContent></Card>
          <Card className="panel-surface"><CardContent className="pt-5"><div className="text-sm font-bold text-on-surface-variant">Sự cố</div><div className="mt-2 text-3xl font-extrabold">{summary.issues}</div></CardContent></Card>
          <Card className="panel-surface"><CardContent className="pt-5"><div className="text-sm font-bold text-on-surface-variant">Thu nhập</div><div className="mt-2 text-2xl font-extrabold text-success">{formatPrice(summary.income)}</div></CardContent></Card>
        </div>

        {loading ? (
          <div className="py-20 text-center text-lg text-muted-foreground">Đang tải danh sách đơn giao...</div>
        ) : deliveries.length === 0 ? (
          <Card className="panel-surface">
            <CardContent className="py-20 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-surface-container text-on-surface-variant">
                <Truck className="h-7 w-7" />
              </div>
              <h2 className="text-xl font-bold text-on-surface">
                {view === "new" ? "Hiện chưa có đơn mới" : "Không có đơn trong tab này"}
              </h2>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-on-surface-variant">
                {view === "new"
                  ? "Khi seller xác nhận đơn hàng, delivery sẽ xuất hiện ở đây để shipper nhận và xử lý."
                  : "Các đơn đã nhận sẽ được tự động phân loại theo trạng thái giao hàng hiện tại."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-5 lg:grid-cols-2">
            {deliveries.map((delivery) => {
              const order = delivery.orderId || {};
              const seller = order.sellerId || {};
              const buyer = order.buyerId || {};
              const product = order.postId || {};
              const isAccepting = acceptingId === delivery._id;

              return (
                <Card key={delivery._id} className="panel-surface overflow-hidden">
                  <CardContent className="pt-6">
                    <div className="mb-5 flex items-start justify-between gap-4">
                      <div>
                        <div className="text-sm font-bold uppercase tracking-[0.12em] text-on-surface-variant">Mã vận đơn</div>
                        <div className="mt-1 text-[1.85rem] font-extrabold text-on-surface">
                          {String(delivery._id).slice(-8).toUpperCase()}
                        </div>
                      </div>
                      <Badge variant={view === "new" ? "warning" : getDeliveryStatusInfo(delivery.deliveryStatus).variant}>
                        {view === "new" ? "Đơn mới" : getDeliveryStatusInfo(delivery.deliveryStatus).label}
                      </Badge>
                    </div>

                    <div className="space-y-5 border-t border-surface-variant/40 pt-5">
                      <div>
                        <div className="text-[1.35rem] font-bold text-on-surface">{product.title || "Đơn giao hàng EcoTrade"}</div>
                        <div className="mt-2 flex flex-wrap gap-3 text-sm text-on-surface-variant">
                          <span className="flex items-center gap-2"><Clock3 className="h-4 w-4" />{formatDateTime(delivery.createdAt)}</span>
                          <span className="flex items-center gap-2"><Package2 className="h-4 w-4" />1 sản phẩm</span>
                          <span>Giá: {formatPrice(order.totalAmount || product.salePrice)}</span>
                          <span>Khoảng cách: Chưa cập nhật</span>
                        </div>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="rounded-2xl bg-surface-container-low p-4">
                          <div className="mb-2 text-xs font-bold uppercase tracking-[0.12em] text-on-surface-variant">Người bán</div>
                          <div className="font-semibold text-on-surface">{seller.fullName || "Chưa có dữ liệu"}</div>
                          <div className="mt-1 flex items-center gap-2 text-sm text-on-surface-variant">
                            <Phone className="h-4 w-4" />
                            {seller.phone || "Chưa có số điện thoại"}
                          </div>
                        </div>
                        <div className="rounded-2xl bg-surface-container-low p-4">
                          <div className="mb-2 text-xs font-bold uppercase tracking-[0.12em] text-on-surface-variant">Người mua</div>
                          <div className="font-semibold text-on-surface">{buyer.fullName || "Chưa có dữ liệu"}</div>
                          <div className="mt-1 flex items-center gap-2 text-sm text-on-surface-variant">
                            <Phone className="h-4 w-4" />
                            {buyer.phone || "Chưa có số điện thoại"}
                          </div>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-dashed border-surface-variant p-4">
                        <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-on-surface-variant">
                          <MapPin className="h-4 w-4" />
                          Điểm lấy hàng
                        </div>
                        <div className="text-sm leading-6 text-on-surface">{delivery.pickupAddress || "Chưa cập nhật địa chỉ lấy hàng"}</div>
                      </div>

                      <div className="rounded-2xl border border-dashed border-surface-variant p-4">
                        <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-on-surface-variant">
                          <MapPin className="h-4 w-4" />
                          Điểm giao hàng
                        </div>
                        <div className="text-sm leading-6 text-on-surface">{delivery.deliveryAddress || "Chưa cập nhật địa chỉ giao hàng"}</div>
                      </div>
                    </div>

                    <div className="mt-5 flex items-center justify-between border-t border-surface-variant/40 pt-5">
                      <div>
                        <div className="text-xs font-bold uppercase tracking-[0.12em] text-on-surface-variant">Phí giao</div>
                        <div className="mt-1 text-[1.4rem] font-extrabold text-success">{formatPrice(delivery.deliveryFee)}</div>
                      </div>
                      <div className="flex gap-3">
                        {view !== "new" ? (
                          <Button asChild variant="outline">
                            <Link to={`/shipper/don/${delivery._id}`}>Xem chi tiết</Link>
                          </Button>
                        ) : null}
                        {view === "new" ? (
                          <Button onClick={() => handleAcceptDelivery(delivery._id)} disabled={isAccepting}>
                            {isAccepting ? "Đang nhận..." : "Nhận đơn"}
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </ShipperLayout>
  );
}
