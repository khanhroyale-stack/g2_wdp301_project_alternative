import { useState, useEffect } from "react";
import Sidebar from "../../components/Sidebar";
import adminService from "../../services/admin.service";
import toast from "react-hot-toast";

const QuanLyHopDong = () => {
  const [rentals, setRentals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  const fetchRentals = async () => {
    setLoading(true);
    try {
      const res = await adminService.getRentals(filter ? { status: filter } : {});
      if (res.success) {
        setRentals(res.data);
      }
    } catch (err) {
      toast.error("Lỗi lấy danh sách hợp đồng");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRentals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const STATUS_MAP = {
    PENDING: { label: "Chờ xác nhận", color: "text-orange-500 bg-orange-50" },
    ACCEPTED: { label: "Đã chấp nhận", color: "text-blue-500 bg-blue-50" },
    ACTIVE: { label: "Đang thuê", color: "text-green-500 bg-green-50" },
    COMPLETED: { label: "Hoàn tất", color: "text-green-600 bg-green-100" },
    CANCELLED: { label: "Đã hủy", color: "text-red-500 bg-red-50" },
    REJECTED: { label: "Bị từ chối", color: "text-red-600 bg-red-100" },
    DISPUTED: { label: "Tranh chấp", color: "text-purple-600 bg-purple-100" },
  };

  return (
    <div className="flex min-h-screen bg-[#F5F5F7]">
      <Sidebar variant="admin" />
      <main className="flex-1 md:ml-64 px-4 md:px-10 py-10">
        <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h2 className="text-3xl font-bold text-on-surface mb-1 flex items-center gap-2">
              <span className="material-symbols-outlined text-tertiary text-3xl">description</span>
              Quản lý Hợp đồng Thuê
            </h2>
            <p className="text-on-surface-variant">Theo dõi hoạt động cho thuê trên hệ thống.</p>
          </div>
          <div className="flex flex-wrap bg-surface-container-low rounded-xl p-1 shadow-sm border border-surface-variant/30">
             {["", "PENDING", "ACTIVE", "COMPLETED", "DISPUTED"].map(st => (
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
          ) : rentals.length === 0 ? (
             <div className="p-10 text-center text-on-surface-variant">
               Không có hợp đồng nào.
             </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-low border-b border-surface-variant/30 text-on-surface-variant text-sm">
                    <th className="p-4 font-semibold">Sản phẩm</th>
                    <th className="p-4 font-semibold">Chủ sở hữu</th>
                    <th className="p-4 font-semibold">Người thuê</th>
                    <th className="p-4 font-semibold">Thời gian</th>
                    <th className="p-4 font-semibold text-right">Tổng phí</th>
                    <th className="p-4 font-semibold text-center">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-variant/20">
                  {rentals.map((r) => (
                    <tr key={r._id} className="hover:bg-surface-container-lowest/50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                           {r.product?.images?.[0] ? (
                             <img src={r.product.images[0]} alt="" className="w-12 h-12 rounded-lg object-cover bg-surface-variant" />
                           ) : (
                             <div className="w-12 h-12 rounded-lg bg-surface-variant flex items-center justify-center">
                               <span className="material-symbols-outlined text-on-surface-variant">image</span>
                             </div>
                           )}
                           <div className="max-w-[150px]">
                             <p className="font-semibold text-sm text-on-surface truncate" title={r.product?.title}>{r.product?.title || "Sản phẩm đã xóa"}</p>
                             <p className="text-xs text-on-surface-variant">{r.totalDays} ngày</p>
                           </div>
                        </div>
                      </td>
                      <td className="p-4 text-sm">
                        <p className="font-medium text-on-surface">{r.owner?.name || "N/A"}</p>
                        <p className="text-xs text-on-surface-variant">{r.owner?.phone || "N/A"}</p>
                      </td>
                      <td className="p-4 text-sm">
                        <p className="font-medium text-on-surface">{r.renter?.name || "N/A"}</p>
                        <p className="text-xs text-on-surface-variant">{r.renter?.phone || "N/A"}</p>
                      </td>
                      <td className="p-4 text-sm text-on-surface-variant">
                         <p>{new Date(r.startDate).toLocaleDateString("vi-VN")}</p>
                         <p className="text-xs font-semibold">→</p>
                         <p>{new Date(r.endDate).toLocaleDateString("vi-VN")}</p>
                      </td>
                      <td className="p-4 text-sm font-bold text-right text-error">
                        {r.totalAmount?.toLocaleString()}đ
                      </td>
                      <td className="p-4 text-center">
                         <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${STATUS_MAP[r.status]?.color || "bg-gray-100 text-gray-600"}`}>
                           {STATUS_MAP[r.status]?.label || r.status}
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

export default QuanLyHopDong;
