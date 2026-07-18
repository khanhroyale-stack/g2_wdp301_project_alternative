import { useCallback, useEffect, useState } from "react";
import { Clock3, MapPin, Navigation, Package2, Truck } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import ShipperLayout from "../../components/shipper/ShipperLayout";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import useRealtimeRefresh from "../../hooks/useRealtimeRefresh";
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
  const refreshRealtime = useCallback(() => {
    fetchSummary();
    fetchDeliveries();
  }, [fetchDeliveries, fetchSummary]);
  useRealtimeRefresh(["delivery", "order"], refreshRealtime);

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
      <div className="w-full max-w-5xl mx-auto">
        {/* Header & Flow Summary */}
        <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 mb-4">
              <div className="h-1.5 w-1.5 rounded-full bg-success animate-pulse"></div>
              <span className="text-[10px] font-black text-primary uppercase tracking-widest">Hệ thống vận hành trực tuyến</span>
            </div>
            <h1 className="text-4xl font-display font-extrabold text-foreground tracking-tight">Lộ trình hôm nay</h1>
            <p className="mt-2 text-on-surface-variant font-medium">Theo dõi và quản lý các đơn hàng theo luồng vận chuyển.</p>
          </div>
          
          <div className="flex items-center gap-2 bg-white p-1.5 rounded-pill shadow-sm border border-primary/5">
            <div className="px-5 py-2 rounded-pill bg-primary/5 text-primary">
              <p className="text-[9px] font-black uppercase tracking-widest opacity-60">Thu nhập</p>
              <p className="text-lg font-display font-black leading-none">{formatPrice(summary.income)}</p>
            </div>
            <div className="h-8 w-px bg-primary/10"></div>
            <div className="px-5 py-2">
              <p className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant/40">Hoàn thành</p>
              <p className="text-lg font-display font-bold text-foreground leading-none">{summary.completed}</p>
            </div>
          </div>
        </div>

        {/* Pill Tabs */}
        <div className="mb-10 flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setView(tab.key)}
              className={`px-8 py-3 rounded-pill text-sm font-bold transition-all ${
                view === tab.key
                  ? "bg-primary text-white shadow-lg shadow-primary/20"
                  : "bg-white text-on-surface-variant hover:bg-primary/5 hover:text-primary border border-primary/5"
              }`}
            >
              {tab.label}
              {summary[tab.key] > 0 && (
                <span className={`ml-2 px-1.5 py-0.5 rounded-full text-[10px] ${view === tab.key ? "bg-white/20" : "bg-primary/10 text-primary"}`}>
                  {summary[tab.key]}
                </span>
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-48 w-full bg-white rounded-organic animate-pulse"></div>
            ))}
          </div>
        ) : deliveries.length === 0 ? (
          <div className="text-center py-32 bg-white rounded-organic border border-primary/5">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/5 text-primary/30">
              <Truck className="h-10 w-10" />
            </div>
            <h2 className="text-2xl font-display font-bold text-foreground">
              {view === "new" ? "Chưa có lộ trình mới" : "Không có đơn trong danh mục này"}
            </h2>
            <p className="mx-auto mt-3 max-w-md text-on-surface-variant font-medium">
              {view === "new"
                ? "Các đơn hàng mới sẽ xuất hiện tại đây khi có yêu cầu vận chuyển từ hệ thống."
                : "Danh sách hiện tại đang trống. Hãy kiểm tra lại các mục khác."}
            </p>
          </div>
        ) : (
          <div className="relative">
            {/* Vertical Timeline Line */}
            <div className="absolute left-8 top-0 bottom-0 w-1 bg-gradient-to-b from-primary/20 via-primary/5 to-transparent hidden md:block"></div>

            <div className="space-y-8">
              {deliveries.map((delivery) => {
                const order = delivery.orderId || {};
                const seller = order.sellerId || {};
                const buyer = order.buyerId || {};
                const product = order.postId || {};
                const isAccepting = acceptingId === delivery._id;
                const statusInfo = getDeliveryStatusInfo(delivery.deliveryStatus);

                return (
                  <div key={delivery._id} className="relative flex flex-col md:flex-row gap-6 md:pl-20">
                    {/* Timeline Node */}
                    <div className="absolute left-4 top-8 -translate-x-1/2 w-8 h-8 rounded-full bg-white border-4 border-primary flex items-center justify-center z-10 hidden md:flex shadow-sm">
                      <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                    </div>

                    <div className="flex-1 bg-white rounded-organic p-8 shadow-sm border border-primary/5 hover:shadow-xl hover:shadow-primary/5 transition-all group">
                      <div className="flex flex-col lg:flex-row justify-between gap-6 mb-8">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-[10px] font-black text-on-surface-variant/40 uppercase tracking-widest">#{String(delivery._id).slice(-8).toUpperCase()}</span>
                            <Badge variant={view === "new" ? "warning" : statusInfo.variant} className="rounded-full px-3 text-[10px] uppercase font-bold tracking-wider">
                              {view === "new" ? "Đơn mới" : statusInfo.label}
                            </Badge>
                          </div>
                          <h3 className="text-2xl font-display font-bold text-foreground leading-tight group-hover:text-primary transition-colors">{product.title || "Vận chuyển EcoTrade"}</h3>
                        </div>

                        <div className="flex flex-col items-end">
                          <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">Phí giao nhận</p>
                          <p className="text-3xl font-display font-black text-primary">{formatPrice(delivery.deliveryFee)}</p>
                        </div>
                      </div>

                      {/* Journey Path */}
                      <div className="relative mb-8 bg-background/50 rounded-2xl p-6">
                        <div className="flex items-start gap-4 mb-8 relative z-10">
                          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm border border-primary/10">
                            <MapPin className="h-5 w-5 text-secondary" />
                          </div>
                          <div className="flex-1">
                            <p className="text-[10px] font-bold text-secondary uppercase tracking-widest mb-1">Điểm lấy hàng</p>
                            <p className="text-sm font-semibold text-foreground leading-relaxed">{delivery.pickupAddress}</p>
                            <div className="flex items-center gap-3 mt-2">
                               <p className="text-xs text-on-surface-variant font-bold">{seller.fullName}</p>
                               <span className="w-1 h-1 rounded-full bg-on-surface-variant/20"></span>
                               <p className="text-xs text-on-surface-variant font-medium">{seller.phone}</p>
                            </div>
                          </div>
                        </div>

                        <div className="absolute left-[39px] top-[60px] bottom-[60px] w-0.5 border-l-2 border-dashed border-primary/20 z-0"></div>

                        <div className="flex items-start gap-4 relative z-10">
                          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-md">
                            <Navigation className="h-5 w-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1">Điểm giao hàng</p>
                            <p className="text-sm font-semibold text-foreground leading-relaxed">{delivery.deliveryAddress}</p>
                            <div className="flex items-center gap-3 mt-2">
                               <p className="text-xs text-on-surface-variant font-bold">{buyer.fullName}</p>
                               <span className="w-1 h-1 rounded-full bg-on-surface-variant/20"></span>
                               <p className="text-xs text-on-surface-variant font-medium">{buyer.phone}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-6 border-t border-primary/5">
                        <div className="flex items-center gap-6 text-on-surface-variant text-xs font-bold uppercase tracking-widest">
                          <span className="flex items-center gap-1.5"><Clock3 className="h-4 w-4 opacity-40" />{formatDateTime(delivery.createdAt)}</span>
                          <span className="flex items-center gap-1.5"><Package2 className="h-4 w-4 opacity-40" />1 kiện hàng</span>
                        </div>
                        
                        <div className="flex gap-3">
                          {view !== "new" ? (
                            <Button asChild variant="outline" className="rounded-pill px-8 font-bold border-primary/20 text-primary hover:bg-primary/5">
                              <Link to={`/shipper/don/${delivery._id}`}>Lộ trình chi tiết</Link>
                            </Button>
                          ) : null}
                          {view === "new" ? (
                            <Button 
                              onClick={() => handleAcceptDelivery(delivery._id)} 
                              disabled={isAccepting}
                              className="rounded-pill px-10 bg-primary hover:bg-primary/90 text-white font-bold shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95"
                            >
                              {isAccepting ? "Đang xử lý..." : "Nhận đơn hàng"}
                            </Button>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </ShipperLayout>
  );
}
