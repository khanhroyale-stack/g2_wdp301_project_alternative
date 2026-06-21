import { useState, useEffect } from "react";
import Sidebar from "../../components/Sidebar";
import rentalService from "../../services/rental.service";
import toast from "react-hot-toast";

const TABS = ["Đồ đang thuê", "Đồ cho thuê"];
const STATUS_MAP = {
  pending: { label: "Chờ xác nhận", color: "bg-orange-50 text-orange-600 border border-orange-200" },
  approved: { label: "Đã xác nhận", color: "bg-blue-50 text-blue-600 border border-blue-200" },
  active: { label: "Đang thuê", color: "bg-green-50 text-green-600 border border-green-200" },
  renting: { label: "Đang thuê", color: "bg-green-50 text-green-600 border border-green-200" },
  return_requested: { label: "Chờ trả đồ", color: "bg-yellow-50 text-yellow-600 border border-yellow-200" },
  completed: { label: "Hoàn tất", color: "bg-teal-50 text-teal-600 border border-teal-200" },
  cancelled: { label: "Đã hủy", color: "bg-red-50 text-red-600 border border-red-200" },
  rejected: { label: "Bị từ chối", color: "bg-red-50 text-red-600 border border-red-200" },
  disputed: { label: "Tranh chấp", color: "bg-purple-50 text-purple-600 border border-purple-200" },
};

// Modal để gia hạn thuê
const ExtendModal = ({ contract, onClose, onSuccess }) => {
  const [extraDays, setExtraDays] = useState(1);
  const [loading, setLoading] = useState(false);

  const handleExtend = async () => {
    setLoading(true);
    try {
      const res = await rentalService.extendRental(contract._id, extraDays);
      if (res.success) {
        toast.success("Gia hạn thành công!");
        onSuccess();
        onClose();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Lỗi gia hạn");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-on-surface">Gia hạn thuê</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <span className="material-symbols-outlined text-2xl text-on-surface-variant">close</span>
          </button>
        </div>

        <p className="text-on-surface-variant mb-6">Sản phẩm: <span className="font-bold">{contract.postId?.title}</span></p>

        <div className="mb-6">
          <label className="block text-sm font-semibold text-on-surface mb-2">Số ngày gia hạn</label>
          <input
            type="number"
            min="1"
            value={extraDays}
            onChange={(e) => setExtraDays(Number(e.target.value))}
            className="w-full px-4 py-3 border border-surface-variant rounded-xl text-sm focus:border-tertiary focus:ring-1 focus:ring-tertiary outline-none"
          />
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} disabled={loading}
            className="flex-1 py-3 border border-surface-variant rounded-xl text-sm font-medium text-on-surface hover:bg-gray-50 transition-colors disabled:opacity-50">
            Hủy
          </button>
          <button onClick={handleExtend} disabled={loading}
            className="flex-1 py-3 bg-tertiary text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-50">
            {loading ? "Đang xử lý..." : "Xác nhận gia hạn"}
          </button>
        </div>
      </div>
    </div>
  );
};

// Modal để xử lý tiền cọc
const DepositModal = ({ contract, onClose, onSuccess }) => {
  const [compensationAmount, setCompensationAmount] = useState(0);
  const [compensationReason, setCompensationReason] = useState("");
  const [loading, setLoading] = useState(false);

  const handleResolve = async () => {
    setLoading(true);
    try {
      const res = await rentalService.resolveDeposit(contract._id, { compensationAmount, compensationReason });
      if (res.success) {
        toast.success("Xử lý tiền cọc thành công!");
        onSuccess();
        onClose();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Lỗi xử lý cọc");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-on-surface">Xử lý tiền cọc</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <span className="material-symbols-outlined text-2xl text-on-surface-variant">close</span>
          </button>
        </div>

        <p className="text-on-surface-variant mb-2">Sản phẩm: <span className="font-bold">{contract.postId?.title}</span></p>
        <p className="text-tertiary font-bold text-xl mb-6">Tiền cọc: {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(contract.depositAmount || 0)}</p>

        <div className="mb-4">
          <label className="block text-sm font-semibold text-on-surface mb-2">Số tiền bồi thường (nếu có)</label>
          <input
            type="number"
            min="0"
            value={compensationAmount}
            onChange={(e) => setCompensationAmount(Number(e.target.value))}
            className="w-full px-4 py-3 border border-surface-variant rounded-xl text-sm focus:border-tertiary focus:ring-1 focus:ring-tertiary outline-none"
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-semibold text-on-surface mb-2">Lý do (nếu có)</label>
          <textarea
            rows={3}
            value={compensationReason}
            onChange={(e) => setCompensationReason(e.target.value)}
            className="w-full px-4 py-3 border border-surface-variant rounded-xl text-sm focus:border-tertiary focus:ring-1 focus:ring-tertiary outline-none resize-none"
          />
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} disabled={loading}
            className="flex-1 py-3 border border-surface-variant rounded-xl text-sm font-medium text-on-surface hover:bg-gray-50 transition-colors disabled:opacity-50">
            Hủy
          </button>
          <button onClick={handleResolve} disabled={loading}
            className="flex-1 py-3 bg-tertiary text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-50">
            {loading ? "Đang xử lý..." : "Xác nhận"}
          </button>
        </div>
      </div>
    </div>
  );
};

const Rentals = () => {
  const [tab, setTab] = useState(0); // 0: Renter, 1: Owner
  const [rentals, setRentals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [extendTarget, setExtendTarget] = useState(null);
  const [depositTarget, setDepositTarget] = useState(null);

  const fetchRentals = async () => {
    setLoading(true);
    try {
      const res = tab === 0 ? await rentalService.getMyRentals() : await rentalService.getMyLends();
      if (res.success) {
        setRentals([...(res.data.requests || []), ...(res.data.contracts || [])]);
      }
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

  const handleRequestReturn = async (id) => {
    setProcessingId(id);
    try {
      const res = await rentalService.requestReturn(id);
      if (res.success) {
        toast.success("Gửi yêu cầu trả đồ thành công!");
        fetchRentals();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Lỗi gửi yêu cầu");
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
      <main className="flex-1 md:ml-72 px-4 md:px-10 py-10">
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
                const status = rental.requestStatus || rental.contractStatus;
                const s = STATUS_MAP[status] || { label: status, color: "bg-surface-variant text-on-surface" };
                const otherPartyName = tab === 0 ? (rental.ownerId?.name || "N/A") : (rental.renterId?.name || "N/A");
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
                          <img src={getImageUrl(rental.postId?.images?.[0])} alt="" className="w-full h-full object-cover rounded-xl" />
                        </div>
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-3 mb-1">
                            <h3 className="font-bold text-on-surface text-lg md:text-xl line-clamp-1">{rental.postId?.title || "Sản phẩm không xác định"}</h3>
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
                              <span className="bg-surface-container px-2 py-0.5 rounded text-xs ml-1">({Math.max(1, Math.ceil((new Date(rental.endDate) - new Date(rental.startDate)) / 86400000))} ngày)</span>
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
                        <p className="font-black text-tertiary text-xl">{formatPrice((rental.rentalFee || 0) + (rental.depositAmount || 0))}</p>
                        {rental.depositAmount > 0 && (
                          <p className="text-xs text-on-surface-variant mt-2 border-t border-surface-variant/50 pt-2 w-full">
                            Cọc: <span className="font-bold">{formatPrice(rental.depositAmount)}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Actions bar */}
                    <div className="bg-surface-container-lowest/50 px-6 py-4 md:px-8 border-t border-surface-variant/30 flex flex-wrap items-center justify-between gap-4">
                      <p className="text-xs text-on-surface-variant">Mã HĐ: <span className="font-mono text-on-surface font-medium">{rental._id.substring(0, 8).toUpperCase()}</span></p>

                      <div className="flex flex-wrap gap-3">
                        {/* RENTER ACTIONS */}
                        {tab === 0 && status === "pending" && (
                          <button onClick={() => updateStatus(rental._id, "cancelled")} disabled={isProcessing}
                            className="px-5 py-2 text-sm font-bold border-2 border-error/20 text-error rounded-xl hover:bg-error/5 hover:border-error/40 transition-all active:scale-95 disabled:opacity-50">
                            Hủy yêu cầu
                          </button>
                        )}
                        {tab === 0 && (status === "active" || status === "renting") && (
                          <>
                            <button onClick={() => setExtendTarget(rental)} disabled={isProcessing}
                              className="px-5 py-2 text-sm font-bold border-2 border-tertiary/20 text-tertiary rounded-xl hover:bg-tertiary/5 hover:border-tertiary/40 transition-all active:scale-95 disabled:opacity-50">
                              Gia hạn
                            </button>
                            <button onClick={() => handleRequestReturn(rental._id)} disabled={isProcessing}
                              className="px-5 py-2 text-sm font-bold bg-tertiary text-white rounded-xl hover:shadow-lg hover:shadow-tertiary/30 transition-all active:scale-95 disabled:opacity-50">
                              Yêu cầu trả đồ
                            </button>
                          </>
                        )}

                        {/* OWNER ACTIONS */}
                        {tab === 1 && status === "pending" && (
                          <>
                            <button onClick={() => updateStatus(rental._id, "rejected")} disabled={isProcessing}
                              className="px-5 py-2 text-sm font-bold border-2 border-error/20 text-error rounded-xl hover:bg-error/5 hover:border-error/40 transition-all active:scale-95 disabled:opacity-50">
                              Từ chối
                            </button>
                            <button onClick={() => updateStatus(rental._id, "approved")} disabled={isProcessing}
                              className="px-5 py-2 text-sm font-bold bg-tertiary text-white rounded-xl hover:shadow-lg hover:shadow-tertiary/30 transition-all active:scale-95 disabled:opacity-50">
                              Chấp nhận
                            </button>
                          </>
                        )}
                        {tab === 1 && (status === "return_requested" || status === "disputed") && (
                          <button onClick={() => setDepositTarget(rental)} disabled={isProcessing}
                            className="px-5 py-2 text-sm font-bold bg-tertiary text-white rounded-xl hover:shadow-lg hover:shadow-tertiary/30 transition-all active:scale-95 disabled:opacity-50">
                            Xử lý tiền cọc
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

      {extendTarget && (
        <ExtendModal
          contract={extendTarget}
          onClose={() => setExtendTarget(null)}
          onSuccess={fetchRentals}
        />
      )}
      {depositTarget && (
        <DepositModal
          contract={depositTarget}
          onClose={() => setDepositTarget(null)}
          onSuccess={fetchRentals}
        />
      )}
    </div>
  );
};
export default Rentals;
