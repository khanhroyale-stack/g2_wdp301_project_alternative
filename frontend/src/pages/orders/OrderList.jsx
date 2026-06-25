import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Clock3, PackageCheck, RotateCcw, ShieldCheck, SlidersHorizontal, Truck } from "lucide-react";
import toast from "react-hot-toast";
import OrderWorkspace from "../../components/orders/OrderWorkspace";
import orderService from "../../services/order.service";

const FILTERS = [
  ["all", "Tất cả"],
  ["pending", "Chờ xử lý"],
  ["confirmed", "Đã chấp nhận"],
  ["shipping", "Đang vận chuyển"],
];

const ORDER_STATUS = {
  pending: ["Chờ xác nhận", "amber"], confirmed: ["Đã chấp nhận", "green"],
  shipping: ["Đang vận chuyển", "blue"], delivered: ["Đã giao hàng", "green"],
  completed: ["Hoàn tất", "green"], cancelled: ["Đã hủy", "red"],
};

const DELIVERY_STATUS = {
  pending: ["Chờ xác nhận", "amber"], accepted: ["Đã lấy hàng", "gray"],
  picking_up: ["Đang lấy hàng", "blue"], picked_up: ["Đã lấy hàng", "gray"],
  in_transit: ["Đang vận chuyển", "blue"], delivered: ["Đã giao hàng", "green"],
  completed: ["Hoàn tất", "green"], failed: ["Giao thất bại", "red"],
};

const toneClass = { green: "border-[#bdeed2] bg-[#ecfff4] text-[#12b85d]", amber: "border-[#f6d66b] bg-[#fff8d9] text-[#9b6a00]", blue: "border-[#b8d3ff] bg-[#eaf2ff] text-[#2463c5]", red: "border-[#ffc5c5] bg-[#fff0f0] text-[#e74343]", gray: "border-[#e1e5e9] bg-[#f3f4f6] text-[#4e5968]" };

const formatMoney = (value) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value || 0);
const formatDate = (value) => new Date(value).toLocaleDateString("vi-VN", { day: "2-digit", month: "short", year: "numeric" });

export default function OrderList() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [processing, setProcessing] = useState(null);

  const loadOrders = async () => {
    setLoading(true);
    try { const res = await orderService.getMyOrders(); if (res.success) setOrders(res.data); }
    catch { toast.error("Không thể tải danh sách đơn hàng"); }
    finally { setLoading(false); }
  };
  useEffect(() => { loadOrders(); }, []);

  const visibleOrders = useMemo(() => orders.filter((order) => {
    if (filter === "all") return !["completed", "cancelled"].includes(order.orderStatus);
    if (filter === "shipping") return ["shipping", "delivered"].includes(order.orderStatus);
    return order.orderStatus === filter;
  }), [filter, orders]);

  const cancelOrder = async (order) => {
    if (!window.confirm("Bạn chắc chắn muốn hủy đơn hàng này? Số lượng sản phẩm sẽ được hoàn lại.")) return;
    setProcessing(order._id);
    try { await orderService.updateOrderStatus(order._id, "cancelled", { cancelReason: "Người mua hủy đơn" }); toast.success("Đã hủy đơn hàng"); await loadOrders(); }
    catch (error) { toast.error(error.response?.data?.message || "Không thể hủy đơn hàng"); }
    finally { setProcessing(null); }
  };

  return (
    <OrderWorkspace>
      <section>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-[32px] font-extrabold tracking-[-.04em]">Đơn hàng của tôi</h1>
          <span className="rounded-full bg-[#e9fff2] px-3 py-1 text-xs font-semibold text-[#15b85e]">{orders.filter(o => !["completed", "cancelled"].includes(o.orderStatus)).length} Đơn hàng</span>
        </div>
        <p className="mt-1 max-w-[700px] text-sm leading-6 text-[#667085]">Quản lý và theo dõi các giao dịch đang diễn ra của bạn. Bạn chỉ có thể hủy đơn nếu quy trình lấy hàng chưa bắt đầu.</p>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-b border-[#dfe3e8] pb-4">
          <div className="flex flex-wrap gap-2">
            {FILTERS.map(([value, label]) => <button key={value} onClick={() => setFilter(value)} className={`rounded-full border px-4 py-2 text-sm ${filter === value ? "border-[#18c76b] bg-[#18c76b] font-medium text-[#062d18]" : "border-[#d9dee5] bg-white text-[#596576]"}`}>{label}</button>)}
          </div>
          <span className="flex items-center gap-2 text-sm text-[#667085]"><SlidersHorizontal className="h-4 w-4" /> Sắp xếp theo: Mới nhất</span>
        </div>

        <div className="mt-7 space-y-3">
          {loading ? <p className="py-16 text-center text-[#667085]">Đang tải đơn hàng...</p> : null}
          {!loading && visibleOrders.length === 0 ? <div className="rounded-xl border border-[#e8ebee] py-16 text-center text-[#667085]">Không có đơn hàng trong mục này.</div> : null}
          {visibleOrders.map((order) => {
            const product = order.postId || {};
            const [orderLabel, orderTone] = ORDER_STATUS[order.orderStatus] || [order.orderStatus, "gray"];
            const [deliveryLabel, deliveryTone] = DELIVERY_STATUS[order.delivery?.deliveryStatus] || ["Chờ xác nhận", "amber"];
            return <article key={order._id} className="grid items-center gap-4 rounded-xl border border-[#e8ebee] bg-white p-5 shadow-[0_1px_3px_rgba(16,24,40,.03)] md:grid-cols-[96px_minmax(0,1fr)_158px_160px]">
              <div className="h-24 w-24 overflow-hidden rounded-lg bg-[#f1f3f5]">{order.productImage ? <img src={order.productImage} alt={product.title} className="h-full w-full object-cover" /> : <PackageCheck className="m-8 h-8 w-8 text-[#a0a8b3]" />}</div>
              <div className="min-w-0 md:border-r md:border-[#e3e7eb] md:pr-4">
                <h2 className="truncate text-lg font-bold">{product.title || "Sản phẩm EcoTrade"}</h2>
                <p className="mt-1 flex items-center gap-2 text-sm text-[#667085]"><Clock3 className="h-4 w-4" /> Ngày đặt: {formatDate(order.createdAt)}</p>
                <p className="mt-2 text-xl font-extrabold">{formatMoney(order.totalAmount)}</p>
              </div>
              <div className="space-y-3 text-center md:border-r md:border-[#e3e7eb] md:px-3">
                <div><p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-[#8a93a1]">Trạng thái order</p><span className={`inline-block rounded-full border px-2 py-1 text-[11px] font-semibold ${toneClass[orderTone]}`}>{orderLabel}</span></div>
                <div><p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-[#8a93a1]">Giao hàng</p><span className={`inline-block rounded-full border px-2 py-1 text-[11px] font-medium ${toneClass[deliveryTone]}`}>{deliveryLabel}</span></div>
              </div>
              <div className="space-y-2">
                <Link to={`/orders/${order._id}`} className="flex h-10 items-center justify-between rounded-md bg-[#18c76b] px-4 text-sm font-medium text-[#062d18]">Xem chi tiết <ArrowRight className="h-4 w-4" /></Link>
                <button onClick={() => cancelOrder(order)} disabled={!order.actions?.canBuyerCancel || processing === order._id} className="flex h-10 w-full items-center justify-center gap-2 rounded-md border border-[#ffcaca] text-sm text-[#ff5555] disabled:cursor-not-allowed disabled:opacity-45"><span className="text-lg">⊗</span>{processing === order._id ? "Đang hủy..." : "Hủy đơn"}</button>
              </div>
            </article>;
          })}
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {[[RotateCcw,"Chính sách hoàn trả","Các đơn hàng có thể được hoàn trả trong vòng 7 ngày kể từ khi nhận hàng nếu có lỗi.","#effaff","#28b7ef"],[Truck,"Giao hàng nhanh","EcoTrade đảm bảo lấy hàng trong vòng 24h kể từ khi người bán chấp nhận đơn.","#effdf5","#18c76b"],[ShieldCheck,"Giao dịch an toàn","Tiền của bạn được giữ an toàn cho đến khi bạn xác nhận đã nhận hàng.","#fffaf1","#f5a623"]].map(([Icon,title,text,bg,color]) => <div key={title} className="flex gap-4 rounded-xl border border-[#edf0f2] p-5" style={{background:bg}}><Icon className="mt-1 h-5 w-5 shrink-0" style={{color}}/><div><h3 className="text-sm font-bold">{title}</h3><p className="mt-2 text-xs leading-5 text-[#667085]">{text}</p></div></div>)}
        </div>
      </section>
    </OrderWorkspace>
  );
}
