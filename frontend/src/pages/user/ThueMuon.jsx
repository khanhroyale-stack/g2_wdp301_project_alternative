import { useState, useEffect } from "react";
import Sidebar from "../../components/Sidebar";
import rentalService from "../../services/rental.service";
import toast from "react-hot-toast";

const TABS = ["Đồ đang thuê", "Đồ cho thuê"];
const STATUS_MAP = {
  PENDING: { label: "Chờ xác nhận", color: "bg-orange-50 text-orange-600 border border-orange-200" },
  ACCEPTED: { label: "Đã xác nhận", color: "bg-blue-50 text-blue-600 border border-blue-200" },
  ACTIVE: { label: "Đang thuê", color: "bg-green-50 text-green-600 border border-green-200" },
  COMPLETED: { label: "Hoàn tất", color: "bg-teal-50 text-teal-600 border border-teal-200" },
  CANCELLED: { label: "Đã hủy", color: "bg-red-50 text-red-600 border border-red-200" },
  REJECTED: { label: "Bị từ chối", color: "bg-red-50 text-red-600 border border-red-200" },
  DISPUTED: { label: "Tranh chấp", color: "bg-purple-50 text-purple-600 border border-purple-200" },
};

const ThueMuon = () => {
  const [tab, setTab] = useState(0); // 0: Renter, 1: Owner
  const [rentals, setRentals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  const fetchRentals = async () => {
    setLoading(true);
    try {
      const res = tab === 0 ? await rentalService.getMyRentals() : await rentalService.getMyLends();
      if (res.success) setRentals(res.data);
    } catch (err) {
      toast.error("Lỗi tải danh sách thuê mượn");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRentals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const updateStatus = async (id, status) => {
    setProcessingId(id);
    try {
      const res = await rentalService.updateRentalStatus(id, status);
      if (res.success) {
        toast.success("Cập nhật trạng thái thành công!");
        fetchRentals();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Lỗi khi cập nhật");
    } finally {
      setProcessingId(null);
    }
  };

  const getImageUrl = (img) => {
    if (!img) return "https://placehold.co/200?text=No+Image";
    if (img.startsWith("http")) return img;
    return `http://localhost:5000${img}`;
  };

  const formatPrice = (num) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num || 0);
  const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });

  return (
    <div className="flex min-h-screen bg-[#F5F5F7] font-sans">
      <Sidebar variant="user" />
      <main className="flex-1 md:ml-64 px-4 md:px-10 py-10">
        <div className="max-w-5xl mx-auto">
          
          <header className="mb-10 flex flex-col md:flex-row justify-between md:items-end gap-6">
            <div>
               <h1 className="text-3xl md:text-4xl font-extrabold text-on-surface mb-2 flex items-center gap-3">
                 <span className="material-symbols-outlined text-tertiary text-4xl">handshake</span>
                 Quản lý Thuê Mượn
               </h1>
               <p className="text-on-surface-variant text-base">Theo dõi hợp đồng và quản lý tài sản thuê mượn.</p>
            </div>
            
            <div className="flex bg-white rounded-full p-1.5 shadow-sm border border-surface-variant/30 w-fit">
              {TABS.map((t, i) => (
                <button key={t} onClick={() => setTab(i)}
                  className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all ${tab === i ? "bg-gradient-to-r from-tertiary to-tertiary-container text-white shadow-md scale-105" : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container"
                    }`}>
                  {t}
                </button>
              ))}
            </div>
          </header>

          {loading ? (
             <div className="flex justify-center items-center py-20">
                <span className="material-symbols-outlined text-tertiary text-5xl animate-spin">refresh</span>
             </div>
          ) : rentals.length === 0 ? (
            <div className="bg-white rounded-3xl py-20 text-center border border-surface-variant/20 shadow-sm flex flex-col items-center">
              <div className="w-24 h-24 bg-surface-container-low rounded-full flex items-center justify-center mb-6">
                 <span className="material-symbols-outlined text-6xl text-tertiary/50">receipt_long</span>
              </div>
              <h3 className="text-xl font-bold text-on-surface mb-2">Chưa có hợp đồng nào</h3>
              <p className="text-on-surface-variant max-w-sm mx-auto">Không tìm thấy yêu cầu thuê mượn nào trong mục này.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {rentals.map((rental) => {
                const s = STATUS_MAP[rental.status] || { label: rental.status, color: "bg-surface-variant text-on-surface" };
                const otherPartyName = tab === 0 ? (rental.owner?.name || "N/A") : (rental.renter?.name || "N/A");
                const isProcessing = processingId === rental._id;

                return (
                  <div key={rental._id} className="bg-white rounded-3xl shadow-sm hover:shadow-apple transition-all border border-surface-variant/20 overflow-hidden flex flex-col group">
                    <div className="p-6 md:p-8 flex items-start flex-col lg:flex-row justify-between gap-6 relative">
                      {isProcessing && (
                         <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-10 flex items-center justify-center">
                            <span className="material-symbols-outlined text-tertiary text-3xl animate-spin">refresh</span>
                         </div>
                      )}
                      
                      <div className="flex items-start gap-5 flex-1 w-full">
                        <div className="w-24 h-24 rounded-2xl overflow-hidden bg-surface-container-low flex-shrink-0 shadow-inner p-1 border border-surface-variant/30">
                          <img src={getImageUrl(rental.product?.images?.[0])} alt="" className="w-full h-full object-cover rounded-xl" />
                        </div>
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-3 mb-1">
                            <h3 className="font-bold text-on-surface text-lg md:text-xl line-clamp-1">{rental.product?.title || "Sản phẩm không xác định"}</h3>
                            <span className={`text-[11px] px-3 py-1 rounded-full font-bold uppercase tracking-wider ${s.color}`}>
                              {s.label}
                            </span>
                          </div>
                          
                          <div className="flex flex-col gap-1.5 mt-3">
                            <p className="text-sm text-on-surface-variant flex items-center gap-2">
                               <span className="material-symbols-outlined text-[16px]">calendar_month</span>
                               <span className="font-semibold text-on-surface">{formatDate(rental.startDate)}</span>
                               <span className="text-xs">→</span>
                               <span className="font-semibold text-on-surface">{formatDate(rental.endDate)}</span>
                               <span className="bg-surface-container px-2 py-0.5 rounded text-xs ml-1">({rental.totalDays} ngày)</span>
                            </p>
                            <p className="text-sm text-on-surface-variant flex items-center gap-2 mt-1">
                               <span className="material-symbols-outlined text-[16px]">person</span>
                               {tab === 0 ? "Chủ đồ:" : "Người thuê:"} <strong className="text-on-surface">{otherPartyName}</strong>
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-surface-container-low rounded-2xl p-4 w-full lg:w-48 flex flex-col justify-center items-end lg:items-center text-right lg:text-center shrink-0 border border-surface-variant/30">
                         <span className="text-xs text-on-surface-variant mb-1 font-medium">Tổng phí thuê</span>
                         <p className="font-black text-tertiary text-xl">{formatPrice(rental.totalAmount)}</p>
                         {rental.product?.depositAmount > 0 && (
                            <p className="text-xs text-on-surface-variant mt-2 border-t border-surface-variant/50 pt-2 w-full">
                               Cọc: <span className="font-bold">{formatPrice(rental.product.depositAmount)}</span>
                            </p>
                         )}
                      </div>
                    </div>

                    {/* Actions bar */}
                    <div className="bg-surface-container-lowest/50 px-6 py-4 md:px-8 border-t border-surface-variant/30 flex flex-wrap items-center justify-between gap-4">
                      <p className="text-xs text-on-surface-variant">Mã HĐ: <span className="font-mono text-on-surface font-medium">{rental._id.substring(0, 8).toUpperCase()}</span></p>
                      
                      <div className="flex flex-wrap gap-3">
                        {/* RENTER ACTIONS */}
                        {tab === 0 && rental.status === "PENDING" && (
                          <button onClick={() => updateStatus(rental._id, "CANCELLED")} disabled={isProcessing}
                            className="px-5 py-2 text-sm font-bold border-2 border-error/20 text-error rounded-xl hover:bg-error/5 hover:border-error/40 transition-all active:scale-95 disabled:opacity-50">
                            Hủy yêu cầu
                          </button>
                        )}
                        {tab === 0 && rental.status === "ACTIVE" && (
                          <button onClick={() => updateStatus(rental._id, "COMPLETED")} disabled={isProcessing}
                            className="px-5 py-2 text-sm font-bold bg-tertiary text-white rounded-xl hover:shadow-lg hover:shadow-tertiary/30 transition-all active:scale-95 disabled:opacity-50">
                            Đã trả đồ (Hoàn tất)
                          </button>
                        )}

                        {/* OWNER ACTIONS */}
                        {tab === 1 && rental.status === "PENDING" && (
                          <>
                            <button onClick={() => updateStatus(rental._id, "REJECTED")} disabled={isProcessing}
                              className="px-5 py-2 text-sm font-bold border-2 border-error/20 text-error rounded-xl hover:bg-error/5 hover:border-error/40 transition-all active:scale-95 disabled:opacity-50">
                              Từ chối
                            </button>
                            <button onClick={() => updateStatus(rental._id, "ACCEPTED")} disabled={isProcessing}
                              className="px-5 py-2 text-sm font-bold bg-tertiary text-white rounded-xl hover:shadow-lg hover:shadow-tertiary/30 transition-all active:scale-95 disabled:opacity-50">
                              Chấp nhận
                            </button>
                          </>
                        )}
                        {tab === 1 && rental.status === "ACCEPTED" && (
                          <button onClick={() => updateStatus(rental._id, "ACTIVE")} disabled={isProcessing}
                            className="px-5 py-2 text-sm font-bold bg-gradient-to-r from-tertiary to-tertiary-container text-white rounded-xl hover:shadow-lg hover:shadow-tertiary/30 transition-all active:scale-95 disabled:opacity-50">
                            Đã giao đồ (Bắt đầu thuê)
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
export default ThueMuon;
