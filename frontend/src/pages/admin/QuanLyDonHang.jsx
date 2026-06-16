import { useState, useEffect } from "react";
import Sidebar from "../../components/Sidebar";
import adminService from "../../services/admin.service";
import toast from "react-hot-toast";

const QuanLyDonHang = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await adminService.getOrders(filter ? { status: filter } : {});
      if (res.success) {
        setOrders(res.data);
      }
    } catch (err) {
      toast.error("Lỗi lấy danh sách đơn hàng");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const STATUS_MAP = {
    PENDING: { label: "Chờ xác nhận", color: "text-orange-500 bg-orange-50" },
    SELLER_CONFIRMED: { label: "Đã xác nhận", color: "text-blue-500 bg-blue-50" },
    PICKING_UP: { label: "Đang lấy hàng", color: "text-purple-500 bg-purple-50" },
    PICKED_UP: { label: "Đã lấy hàng", color: "text-purple-600 bg-purple-50" },
    DELIVERING: { label: "Đang giao", color: "text-blue-600 bg-blue-50" },
    DELIVERED: { label: "Đã giao", color: "text-green-500 bg-green-50" },
    COMPLETED: { label: "Hoàn tất", color: "text-green-600 bg-green-100" },
    CANCELLED: { label: "Đã hủy", color: "text-red-500 bg-red-50" },
  };

  return (
    <div className="flex min-h-screen bg-[#F5F5F7]">
      <Sidebar variant="admin" />
      <main className="flex-1 md:ml-64 px-4 md:px-10 py-10">
        <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h2 className="text-3xl font-bold text-on-surface mb-1 flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary text-3xl">local_mall</span>
              Quản lý Đơn hàng
            </h2>
            <p className="text-on-surface-variant">Giám sát tiến độ mua bán trên hệ thống.</p>
          </div>
          <div className="flex bg-surface-container-low rounded-xl p-1 shadow-sm border border-surface-variant/30">
             {["", "PENDING", "DELIVERING", "COMPLETED", "CANCELLED"].map(st => (
               <button
                 key={st}
                 onClick={() => setFilter(st)}
                 className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${filter === st ? "bg-white text-primary shadow" : "text-on-surface-variant hover:text-on-surface"}`}
               >
                 {st === "" ? "Tất cả" : STATUS_MAP[st]?.label || st}
               </button>
             ))}
          </div>
        </header>

        <div className="bg-surface-container-lowest rounded-2xl shadow-apple border border-surface-variant/30 overflow-hidden">
          {loading ? (
             <div className="p-10 flex justify-center text-primary">
                <span className="material-symbols-outlined animate-spin text-4xl">refresh</span>
             </div>
          ) : orders.length === 0 ? (
             <div className="p-10 text-center text-on-surface-variant">
               Không có đơn hàng nào.
             </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-low border-b border-surface-variant/30 text-on-surface-variant text-sm">
                    <th className="p-4 font-semibold">Sản phẩm</th>
                    <th className="p-4 font-semibold">Người bán</th>
                    <th className="p-4 font-semibold">Người mua</th>
                    <th className="p-4 font-semibold">Shipper</th>
                    <th className="p-4 font-semibold text-right">Tổng tiền</th>
                    <th className="p-4 font-semibold text-center">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-variant/20">
                  {orders.map((o) => (
                    <tr key={o._id} className="hover:bg-surface-container-lowest/50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                           {o.product?.images?.[0] ? (
                             <img src={o.product.images[0]} alt="" className="w-12 h-12 rounded-lg object-cover bg-surface-variant" />
                           ) : (
                             <div className="w-12 h-12 rounded-lg bg-surface-variant flex items-center justify-center">
                               <span className="material-symbols-outlined text-on-surface-variant">image</span>
                             </div>
                           )}
                           <div className="max-w-[150px]">
                             <p className="font-semibold text-sm text-on-surface truncate" title={o.product?.title}>{o.product?.title || "Sản phẩm đã xóa"}</p>
                             <p className="text-xs text-on-surface-variant">{new Date(o.createdAt).toLocaleDateString("vi-VN")}</p>
                           </div>
                        </div>
                      </td>
                      <td className="p-4 text-sm">
                        <p className="font-medium text-on-surface">{o.seller?.name || "N/A"}</p>
                        <p className="text-xs text-on-surface-variant">{o.seller?.phone || "N/A"}</p>
                      </td>
                      <td className="p-4 text-sm">
                        <p className="font-medium text-on-surface">{o.buyer?.name || "N/A"}</p>
                        <p className="text-xs text-on-surface-variant">{o.buyer?.phone || "N/A"}</p>
                      </td>
                      <td className="p-4 text-sm">
                        {o.shipper ? (
                          <>
                            <p className="font-medium text-on-surface">{o.shipper.name}</p>
                            <p className="text-xs text-on-surface-variant">{o.shipper.phone}</p>
                          </>
                        ) : (
                          <span className="text-on-surface-variant italic text-xs">Chưa có</span>
                        )}
                      </td>
                      <td className="p-4 text-sm font-bold text-right text-error">
                        {o.totalAmount?.toLocaleString()}đ
                      </td>
                      <td className="p-4 text-center">
                         <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${STATUS_MAP[o.status]?.color || "bg-gray-100 text-gray-600"}`}>
                           {STATUS_MAP[o.status]?.label || o.status}
                         </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default QuanLyDonHang;
