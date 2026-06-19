import { useState, useEffect } from "react";
import Sidebar from "../../components/Sidebar";
import adminService from "../../services/admin.service";
import toast from "react-hot-toast";

// orderStatus trong model: pending | confirmed | shipping | delivered | completed | cancelled | disputed
const STATUS_MAP = {
  pending: { label: "Chờ xác nhận", color: "text-orange-600 bg-orange-50 border border-orange-200" },
  confirmed: { label: "Đã xác nhận", color: "text-blue-600 bg-blue-50 border border-blue-200" },
  shipping: { label: "Đang giao", color: "text-cyan-600 bg-cyan-50 border border-cyan-200" },
  delivered: { label: "Đã giao", color: "text-teal-600 bg-teal-50 border border-teal-200" },
  completed: { label: "Hoàn tất", color: "text-green-700 bg-green-50 border border-green-200" },
  cancelled: { label: "Đã hủy", color: "text-red-600 bg-red-50 border border-red-200" },
  disputed: { label: "Tranh chấp", color: "text-purple-600 bg-purple-50 border border-purple-200" },
};

const FILTERS = [
  { v: "", label: "Tất cả" },
  { v: "pending", label: "Chờ xác nhận" },
  { v: "shipping", label: "Đang giao" },
  { v: "completed", label: "Hoàn tất" },
  { v: "cancelled", label: "Đã hủy" },
];

const OrderManagement = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await adminService.getOrders(filter ? { orderStatus: filter } : {});
      if (res.success) setOrders(res.data);
    } catch {
      toast.error("Lỗi lấy danh sách đơn hàng");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, [filter]); // eslint-disable-line

  const fmt = (n) => (n || 0).toLocaleString("vi-VN") + "₫";

  return (
    <div className="flex min-h-screen bg-[#F5F5F7]">
      <Sidebar variant="admin" />
      <main className="flex-1 md:ml-64 px-4 md:px-10 py-10">

        <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h2 className="text-2xl font-bold text-on-surface mb-1">Quản lý Đơn hàng</h2>
            <p className="text-on-surface-variant text-sm">Giám sát tiến độ mua bán trên hệ thống.</p>
          </div>
          <div className="flex flex-wrap gap-1 bg-surface-container-low rounded-xl p-1 border border-surface-variant/30">
            {FILTERS.map((f) => (
              <button key={f.v} onClick={() => setFilter(f.v)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${filter === f.v ? "bg-white text-primary shadow-sm" : "text-on-surface-variant hover:text-on-surface"
                  }`}>
                {f.label}
              </button>
            ))}
          </div>
        </header>

        <div className="bg-surface-container-lowest rounded-2xl shadow-apple border border-surface-variant/30 overflow-hidden">
          {loading ? (
            <div className="p-10 flex justify-center">
              <span className="material-symbols-outlined animate-spin text-3xl text-primary">refresh</span>
            </div>
          ) : orders.length === 0 ? (
            <div className="p-10 text-center text-on-surface-variant">
              <span className="material-symbols-outlined text-4xl block mb-2 opacity-30">receipt_long</span>
              <p className="text-sm">Không có đơn hàng nào.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-low border-b border-surface-variant/30">
                    {["Sản phẩm", "Người bán", "Người mua", "Tổng tiền", "Ngày đặt", "Trạng thái"].map((h) => (
                      <th key={h} className="p-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-variant/20">
                  {orders.map((o) => {
                    const badge = STATUS_MAP[o.orderStatus] || { label: o.orderStatus, color: "bg-surface-container text-on-surface-variant" };
                    const sellerName = o.sellerId?.fullName || o.sellerId?.name || "N/A";
                    const buyerName = o.buyerId?.fullName || o.buyerId?.name || "N/A";
                    return (
                      <tr key={o._id} className="hover:bg-surface-bright/40 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-xl bg-surface-container-low flex-shrink-0 overflow-hidden">
                              {o.postId?.images?.[0]
                                ? <img src={o.postId.images[0]} alt="" className="w-full h-full object-cover" />
                                : <span className="material-symbols-outlined text-on-surface-variant m-auto block text-center mt-2.5">image</span>
                              }
                            </div>
                            <div className="max-w-[160px]">
                              <p className="font-semibold text-sm text-on-surface truncate">{o.postId?.title || "Sản phẩm đã xóa"}</p>
                              <p className="text-xs text-on-surface-variant">{o._id.substring(0, 8).toUpperCase()}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-sm">
                          <p className="font-medium text-on-surface">{sellerName}</p>
                          <p className="text-xs text-on-surface-variant">{o.sellerId?.phone || ""}</p>
                        </td>
                        <td className="p-4 text-sm">
                          <p className="font-medium text-on-surface">{buyerName}</p>
                          <p className="text-xs text-on-surface-variant">{o.buyerId?.phone || ""}</p>
                        </td>
                        <td className="p-4 text-sm font-bold text-primary">{fmt(o.totalAmount)}</td>
                        <td className="p-4 text-xs text-on-surface-variant">
                          {new Date(o.createdAt).toLocaleDateString("vi-VN")}
                        </td>
                        <td className="p-4">
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${badge.color}`}>
                            {badge.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
export default OrderManagement;
