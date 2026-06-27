import { useEffect, useMemo, useState } from "react";
import { Ban, CalendarDays, CheckCircle2, Download, Package, Search } from "lucide-react";
import { Link } from "react-router-dom";
import OrderWorkspace from "../../components/orders/OrderWorkspace";
import orderService from "../../services/order.service";

const money = (value) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value || 0);
const shortId = (id) => `ORD-${String(id).slice(-4).toUpperCase()}`;

export default function OrderHistory() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("all");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 5;

  useEffect(() => {
    orderService.getMyOrders().then((res) => res.success && setOrders(res.data)).finally(() => setLoading(false));
  }, []);

  const history = useMemo(() => orders.filter(order => ["completed", "cancelled"].includes(order.orderStatus)), [orders]);
  const filtered = useMemo(() => history.filter(order => {
    if (status !== "all" && order.orderStatus !== status) return false;
    const text = `${order._id} ${order.postId?.title || ""}`.toLowerCase();
    return text.includes(query.trim().toLowerCase());
  }), [history, query, status]);
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const rows = filtered.slice((page - 1) * pageSize, page * pageSize);
  const completed = history.filter(order => order.orderStatus === "completed").length;
  const cancelled = history.filter(order => order.orderStatus === "cancelled").length;

  const exportCsv = () => {
    const content = ["Ma don,San pham,Ngay giao dich,Tong tien,Trang thai", ...filtered.map(o => `"${shortId(o._id)}","${(o.postId?.title || "").replaceAll('"','""')}","${new Date(o.updatedAt).toLocaleDateString("vi-VN")}",${o.totalAmount},${o.orderStatus}`)].join("\n");
    const url = URL.createObjectURL(new Blob(["\ufeff", content], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = "lich-su-giao-dich.csv"; anchor.click(); URL.revokeObjectURL(url);
  };

  return <OrderWorkspace>
    <p className="text-sm text-[#667085]">Quản lý <span className="mx-2">›</span> <span className="text-[#202124]">Lịch sử giao dịch</span></p>
    <h1 className="mt-2 text-[32px] font-extrabold tracking-[-.04em]">Lịch sử Giao dịch</h1>
    <p className="mt-1 text-sm text-[#667085]">Xem lại và quản lý các giao dịch bạn đã thực hiện trên EcoTrade.</p>

    <div className="mt-8 grid gap-5 md:grid-cols-3">
      {[["Tổng đơn hàng",history.length,Package,"#eafaf1","#18c76b"],["Đã hoàn thành",completed,CheckCircle2,"#e6fbef","#10b95c"],["Yêu cầu đã hủy",cancelled,Ban,"#ffe9e9","#ff4747"]].map(([label,value,Icon,bg,color]) => <div key={label} className="flex items-center justify-between rounded-xl border border-[#e8ebee] bg-white px-6 py-6 shadow-[0_1px_3px_rgba(16,24,40,.03)]"><div><p className="text-sm text-[#667085]">{label}</p><p className="mt-1 text-2xl font-extrabold">{value} đơn</p></div><span className="rounded-full p-3" style={{background:bg,color}}><Icon className="h-5 w-5"/></span></div>)}
    </div>

    <div className="mt-8 flex flex-col justify-between gap-4 md:flex-row">
      <div className="flex w-fit rounded-lg bg-[#f6f7f9] p-1">{[["all","Tất cả"],["completed","Đã hoàn tất"],["cancelled","Đã hủy"]].map(([value,label]) => <button key={value} onClick={() => {setStatus(value);setPage(1);}} className={`rounded-md px-4 py-2 text-sm ${status === value ? "border border-[#e2e6ea] bg-white shadow-sm" : "text-[#667085]"}`}>{label}</button>)}</div>
      <div className="flex gap-3">
        <label className="flex h-10 w-full min-w-[255px] items-center gap-2 rounded-md border border-[#d8dde4] px-3"><Search className="h-4 w-4 text-[#667085]"/><input value={query} onChange={e => {setQuery(e.target.value);setPage(1);}} className="w-full text-sm outline-none" placeholder="Tìm mã đơn, sản phẩm..."/></label>
        <button className="flex h-10 w-10 items-center justify-center rounded-md border border-[#d8dde4]"><CalendarDays className="h-4 w-4"/></button>
        <button onClick={exportCsv} className="flex h-10 whitespace-nowrap items-center gap-2 rounded-md border border-[#d8dde4] px-4 text-sm"><Download className="h-4 w-4"/>Xuất báo cáo</button>
      </div>
    </div>

    <div className="mt-7 overflow-hidden rounded-xl border border-[#d8dde4] bg-white">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[850px] text-left text-sm">
          <thead className="border-b border-[#d8dde4] bg-[#fbfcfd] text-[#596576]"><tr><th className="px-4 py-4 font-medium">Mã đơn hàng</th><th className="px-4 py-4 font-medium">Sản phẩm</th><th className="px-4 py-4 font-medium">Ngày giao dịch</th><th className="px-4 py-4 font-medium">Tổng tiền</th><th className="px-4 py-4 font-medium">Trạng thái</th><th className="px-4 py-4 text-right font-medium">Thao tác</th></tr></thead>
          <tbody>{loading ? <tr><td colSpan="6" className="px-4 py-16 text-center text-[#667085]">Đang tải lịch sử...</td></tr> : null}{!loading && rows.length === 0 ? <tr><td colSpan="6" className="px-4 py-16 text-center text-[#667085]">Chưa có giao dịch đã kết thúc.</td></tr> : null}{rows.map(order => <tr key={order._id} className="border-b border-[#e3e7eb] last:border-0"><td className="px-4 py-5 text-[#596576]">{shortId(order._id)}</td><td className="px-4 py-5"><div className="flex items-center gap-3"><div className="h-12 w-12 overflow-hidden rounded-md bg-[#f1f3f5]">{order.productImage ? <img src={order.productImage} alt="" className="h-full w-full object-cover"/> : null}</div><div><p className="max-w-[240px] truncate font-semibold">{order.postId?.title || "Sản phẩm EcoTrade"}</p><p className="mt-1 text-xs text-[#667085]">Số lượng: {order.quantity || 1}</p></div></div></td><td className="px-4 py-5"><p>{new Date(order.updatedAt).toLocaleDateString("vi-VN")}</p><p className="mt-1 text-[10px] font-semibold text-[#667085]">UTC+7</p></td><td className={`px-4 py-5 font-bold ${order.orderStatus === "completed" ? "text-[#12b85d]" : "text-[#202124]"}`}>{money(order.totalAmount)}</td><td className="px-4 py-5"><span className={`inline-block min-w-[86px] rounded-full border px-3 py-1 text-center text-[11px] ${order.orderStatus === "completed" ? "border-[#bdeed2] bg-[#ecfff4] text-[#12b85d]" : "border-[#ffc5c5] bg-[#fff0f0] text-[#e74343]"}`}>{order.orderStatus === "completed" ? "Hoàn tất" : "Đã hủy"}</span></td><td className="px-4 py-5 text-right"><Link to={`/orders/${order._id}`} className="rounded-md border border-[#d8dde4] px-3 py-2 text-xs">Chi tiết</Link></td></tr>)}</tbody>
        </table>
      </div>
      <div className="flex items-center justify-between border-t border-[#d8dde4] px-5 py-4 text-sm text-[#596576]"><span>Hiển thị {rows.length ? (page-1)*pageSize+1 : 0}-{Math.min(page*pageSize,filtered.length)} trong {filtered.length} kết quả</span><div className="flex gap-2"><button disabled={page===1} onClick={()=>setPage(p=>p-1)} className="rounded-md border border-[#d8dde4] px-3 py-2 disabled:opacity-40">Trước</button>{Array.from({length:pages},(_,i)=>i+1).slice(0,3).map(value=><button key={value} onClick={()=>setPage(value)} className={`h-9 w-9 rounded-md border ${page===value ? "border-[#18c76b] bg-[#18c76b]" : "border-[#d8dde4]"}`}>{value}</button>)}<button disabled={page===pages} onClick={()=>setPage(p=>p+1)} className="rounded-md border border-[#d8dde4] px-3 py-2 disabled:opacity-40">Sau</button></div></div>
    </div>

    <div className="mt-8 grid gap-7 md:grid-cols-2"><div className="rounded-xl bg-[#edfff4] p-6"><h3 className="font-bold">◷ &nbsp; Chính sách lưu trữ</h3><p className="mt-6 text-sm leading-6 text-[#667085]">EcoTrade lưu trữ lịch sử giao dịch của bạn trong vòng 2 năm kể từ ngày hoàn tất. Bạn có thể yêu cầu trích xuất dữ liệu định kỳ thông qua Help Center.</p></div><div className="rounded-xl bg-[#edfaff] p-6"><h3 className="font-bold text-[#202124]">↗ &nbsp; Báo cáo hàng tháng</h3><p className="mt-6 text-sm leading-6 text-[#667085]">Theo dõi toàn bộ giao dịch và số tiền bạn đã tiết kiệm bằng việc mua đồ pre-owned thay vì mua mới.</p></div></div>
  </OrderWorkspace>;
}
