import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Sidebar from "../../components/Sidebar";
import rentalService from "../../services/rental.service";
import toast from "react-hot-toast";

// ─── Hằng số ─────────────────────────────────────────────────────────────────
const STATUS_MAP = {
  pending:          { label: "Chờ xác nhận",     color: "bg-orange-50 text-orange-600 border-orange-200" },
  approved:         { label: "Đã xác nhận",       color: "bg-blue-50 text-blue-600 border-blue-200" },
  active:           { label: "Chờ nhận đồ",       color: "bg-sky-50 text-sky-600 border-sky-200" },
  renting:          { label: "Đang thuê",         color: "bg-green-50 text-green-600 border-green-200" },
  return_requested: { label: "Chờ nhận lại đồ",   color: "bg-yellow-50 text-yellow-700 border-yellow-200" },
  completed:        { label: "Hoàn tất",          color: "bg-teal-50 text-teal-600 border-teal-200" },
  cancelled:        { label: "Đã hủy",            color: "bg-gray-50 text-gray-500 border-gray-200" },
  rejected:         { label: "Bị từ chối",        color: "bg-red-50 text-red-500 border-red-200" },
  disputed:         { label: "Tranh chấp",        color: "bg-purple-50 text-purple-600 border-purple-200" },
};

const STATUS_FILTERS = [
  { value: "all",              label: "Tất cả" },
  { value: "pending",          label: "Chờ xác nhận" },
  { value: "active",           label: "Chờ nhận đồ" },
  { value: "renting",          label: "Đang thuê" },
  { value: "return_requested", label: "Chờ nhận lại" },
  { value: "completed",        label: "Hoàn tất" },
  { value: "cancelled",        label: "Đã hủy / Từ chối" },
  { value: "disputed",         label: "Tranh chấp" },
];

const fmt = (num) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(num || 0);
const fmtDate = (d) =>
  new Date(d).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
const fmtDateTime = (d) =>
  new Date(d).toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

const imgUrl = (src) => {
  if (!src) return null;
  return src;
};

// ─── StatusBadge ─────────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const s = STATUS_MAP[status] || { label: status, color: "bg-gray-50 text-gray-500 border-gray-200" };
  return (
    <span className={`text-[11px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider border ${s.color}`}>
      {s.label}
    </span>
  );
};

// ─── Modal gia hạn ────────────────────────────────────────────────────────────
const ExtendModal = ({ contract, onClose, onSuccess }) => {
  const [days, setDays] = useState(1);
  const [loading, setLoading] = useState(false);
  const pricePerDay = contract.postId?.rentPricePerDay || 0;

  const handle = async () => {
    if (days < 1) return;
    setLoading(true);
    try {
      const res = await rentalService.extendRental(contract._id, days);
      if (res.success) {
        toast.success("Đã gửi yêu cầu gia hạn! Chờ chủ đồ xác nhận.");
        onSuccess();
        onClose();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Lỗi gia hạn");
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-sm">
        <h2 className="text-xl font-bold mb-1">Gia hạn thuê</h2>
        <p className="text-sm text-gray-500 mb-5 line-clamp-1">{contract.postId?.title}</p>
        <label className="text-sm font-semibold text-gray-700 mb-2 block">Số ngày gia hạn</label>
        <input type="number" min={1} max={90} value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          className="w-full border rounded-xl px-4 py-3 text-lg font-bold mb-3 outline-none focus:ring-2 focus:ring-green-400" />
        {pricePerDay > 0 && (
          <p className="text-sm text-gray-500 mb-5">
            Phí dự tính: <strong className="text-green-600">{fmt(pricePerDay * days)}</strong>
          </p>
        )}
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border-2 border-gray-200 font-bold text-gray-600">Huỷ</button>
          <button onClick={handle} disabled={loading || days < 1}
            className="flex-1 py-3 rounded-xl bg-green-500 text-white font-bold disabled:opacity-50">
            {loading ? "..." : "Gia hạn"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Modal xử lý cọc ─────────────────────────────────────────────────────────
const DepositModal = ({ contract, onClose, onSuccess }) => {
  const [comp, setComp] = useState(0);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const refund = Math.max(0, (contract.depositAmount || 0) - comp);

  const handle = async () => {
    setLoading(true);
    try {
      const res = await rentalService.resolveDeposit(contract._id, { compensationAmount: comp, compensationReason: reason });
      if (res.success) { toast.success("Xử lý cọc thành công!"); onSuccess(); onClose(); }
    } catch (err) {
      toast.error(err.response?.data?.message || "Lỗi xử lý cọc");
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-sm">
        <h2 className="text-xl font-bold mb-1">Xử lý tiền cọc</h2>
        <p className="text-sm text-gray-500 mb-4 line-clamp-1">{contract.postId?.title}</p>
        <div className="bg-gray-50 rounded-xl p-4 mb-4 text-sm">
          Tiền cọc ban đầu: <strong>{fmt(contract.depositAmount)}</strong>
        </div>
        <label className="text-sm font-semibold text-gray-700 mb-2 block">Bồi thường (0 = hoàn 100%)</label>
        <input type="number" min={0} max={contract.depositAmount} value={comp}
          onChange={(e) => setComp(Number(e.target.value))}
          className="w-full border rounded-xl px-4 py-3 font-bold mb-3 outline-none focus:ring-2 focus:ring-green-400" />
        {comp > 0 && (
          <>
            <label className="text-sm font-semibold text-gray-700 mb-2 block">Lý do bồi thường</label>
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2}
              placeholder="Ví dụ: Màn hình bị trầy xước..."
              className="w-full border rounded-xl px-4 py-3 text-sm mb-3 resize-none outline-none focus:ring-2 focus:ring-green-400" />
          </>
        )}
        <div className="bg-green-50 rounded-xl p-3 mb-5 text-sm">
          <p>Hoàn lại: <strong className="text-green-600">{fmt(refund)}</strong></p>
          {comp > 0 && <p>Bồi thường: <strong className="text-red-500">{fmt(comp)}</strong></p>}
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border-2 border-gray-200 font-bold text-gray-600">Huỷ</button>
          <button onClick={handle} disabled={loading}
            className="flex-1 py-3 rounded-xl bg-green-500 text-white font-bold disabled:opacity-50">
            {loading ? "..." : "Xác nhận"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── RentalCard ───────────────────────────────────────────────────────────────
const RentalCard = ({ rental, isOwnerView, onAction, onExtend, onDeposit, onView, processing }) => {
  const status = rental.requestStatus || rental.contractStatus;
  const isContract = !!rental.contractStatus;
  const otherParty = isOwnerView ? rental.renterId : rental.ownerId;
  const thumbSrc = imgUrl(rental.postId?.thumbnailUrl || rental.postId?.imageUrls?.[0]);
  const totalDays = Math.max(1, Math.ceil((new Date(rental.endDate) - new Date(rental.startDate)) / 86400000));

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden">
      {/* Top */}
      <div className="p-5 flex gap-4">
        {/* Ảnh sản phẩm */}
        <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-50 flex-shrink-0 border border-gray-100">
          {thumbSrc
            ? <img src={thumbSrc} alt="" className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center text-gray-300">
                <span className="material-symbols-outlined text-3xl">image</span>
              </div>
          }
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-bold text-gray-900 text-base leading-tight line-clamp-2 flex-1">
              {rental.postId?.title || "Sản phẩm không xác định"}
            </h3>
            <StatusBadge status={status} />
          </div>

          {/* Ngày thuê */}
          <p className="text-sm text-gray-500 flex items-center gap-1.5 mb-1">
            <span className="material-symbols-outlined text-[15px]">calendar_month</span>
            <span className="font-medium text-gray-700">{fmtDate(rental.startDate)}</span>
            <span>→</span>
            <span className="font-medium text-gray-700">{fmtDate(rental.endDate)}</span>
            <span className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">{totalDays} ngày</span>
          </p>

          {/* Đối phương */}
          <p className="text-sm text-gray-500 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[15px]">person</span>
            <span>{isOwnerView ? "Người thuê:" : "Chủ đồ:"}</span>
            <strong className="text-gray-800">
              {otherParty?.fullName || otherParty?.name || "—"}
            </strong>
            {otherParty?.phone && (
              <a href={`tel:${otherParty.phone}`}
                className="ml-1 text-blue-500 hover:underline text-xs flex items-center gap-0.5">
                <span className="material-symbols-outlined text-[13px]">phone</span>
                {otherParty.phone}
              </a>
            )}
          </p>
        </div>
      </div>

      {/* Chi phí */}
      <div className="mx-5 mb-4 bg-gray-50 rounded-xl p-3 grid grid-cols-3 gap-2 text-center text-xs">
        <div>
          <p className="text-gray-400 mb-0.5">Tiền thuê</p>
          <p className="font-bold text-gray-800">{fmt(rental.rentalFee)}</p>
        </div>
        <div className="border-x border-gray-200">
          <p className="text-gray-400 mb-0.5">Tiền cọc</p>
          <p className="font-bold text-gray-800">{fmt(rental.depositAmount)}</p>
        </div>
        <div>
          <p className="text-gray-400 mb-0.5">Tổng cộng</p>
          <p className="font-bold text-green-600">{fmt((rental.rentalFee || 0) + (rental.depositAmount || 0))}</p>
        </div>
      </div>

      {/* Banner yêu cầu gia hạn đang chờ duyệt */}
      {isContract && rental.extendStatus === "pending" && (
        <div className={`mx-5 mb-3 rounded-xl p-3 text-xs border flex items-center justify-between gap-3 ${
          isOwnerView ? "bg-amber-50 border-amber-200 text-amber-800" : "bg-sky-50 border-sky-200 text-sky-700"
        }`}>
          <span>
            {isOwnerView
              ? `Người thuê muốn gia hạn thêm ${rental.pendingExtendDays} ngày (+${fmt(rental.pendingExtendFee)}). Bạn có đồng ý?`
              : `Yêu cầu gia hạn ${rental.pendingExtendDays} ngày đang chờ chủ đồ xác nhận...`
            }
          </span>
          {isOwnerView && (
            <div className="flex gap-2 flex-shrink-0">
              <button onClick={() => onAction(rental._id, "extend_reject")} disabled={processing}
                className="px-2.5 py-1 text-xs font-bold text-red-500 border border-red-200 rounded-lg hover:bg-red-50 disabled:opacity-50">
                Từ chối
              </button>
              <button onClick={() => onAction(rental._id, "extend_approve")} disabled={processing}
                className="px-2.5 py-1 text-xs font-bold text-white bg-green-500 rounded-lg hover:bg-green-600 disabled:opacity-50">
                Chấp nhận
              </button>
            </div>
          )}
        </div>
      )}

      {/* Kết quả cọc nếu đã xử lý */}
      {isContract && (rental.compensationAmount > 0 || rental.depositRefundAmount > 0) && (
        <div className="mx-5 mb-4 bg-blue-50 rounded-xl p-3 text-xs flex gap-4">
          {rental.compensationAmount > 0 && (
            <span className="text-red-500">Bồi thường: <strong>{fmt(rental.compensationAmount)}</strong></span>
          )}
          {rental.depositRefundAmount > 0 && (
            <span className="text-green-600">Hoàn cọc: <strong>{fmt(rental.depositRefundAmount)}</strong></span>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="px-5 py-3 border-t border-gray-50 flex items-center justify-between gap-3 flex-wrap">
        <p className="text-[11px] text-gray-400 font-mono">
          {isContract ? "HĐ" : "YC"}#{rental._id.slice(-8).toUpperCase()}
          <span className="ml-2 text-gray-300">·</span>
          <span className="ml-2">{fmtDateTime(rental.createdAt)}</span>
        </p>

        <div className="flex gap-2 flex-wrap">
          {/* Xem chi tiết */}
          <button onClick={() => onView(rental._id)}
            className="px-3 py-1.5 text-xs font-semibold text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all">
            Chi tiết
          </button>

          {/* ── RENTER ACTIONS ── */}
          {!isOwnerView && status === "pending" && (
            <button onClick={() => onAction(rental._id, "cancelled")} disabled={processing}
              className="px-3 py-1.5 text-xs font-bold text-red-500 border border-red-200 rounded-lg hover:bg-red-50 transition-all disabled:opacity-50">
              Hủy yêu cầu
            </button>
          )}
          {/* active = chờ nhận đồ → renter xác nhận đã nhận */}
          {!isOwnerView && status === "active" && (
            <button onClick={() => onAction(rental._id, "renting")} disabled={processing}
              className="px-3 py-1.5 text-xs font-bold text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-all disabled:opacity-50">
              Xác nhận đã nhận đồ
            </button>
          )}
          {/* renting = đang thuê → gia hạn hoặc trả đồ */}
          {!isOwnerView && status === "renting" && (
            <>
              <button onClick={() => onExtend(rental)} disabled={processing}
                className="px-3 py-1.5 text-xs font-bold text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-all disabled:opacity-50">
                Gia hạn
              </button>
              <button onClick={() => onAction(rental._id, "return")} disabled={processing}
                className="px-3 py-1.5 text-xs font-bold text-white bg-amber-500 rounded-lg hover:bg-amber-600 transition-all disabled:opacity-50">
                Yêu cầu trả đồ
              </button>
            </>
          )}

          {/* ── OWNER ACTIONS ── */}
          {isOwnerView && status === "pending" && (
            <>
              <button onClick={() => onAction(rental._id, { status: "rejected" })} disabled={processing}
                className="px-3 py-1.5 text-xs font-bold text-red-500 border border-red-200 rounded-lg hover:bg-red-50 transition-all disabled:opacity-50">
                Từ chối
              </button>
              <button onClick={() => onAction(rental._id, { status: "approved" })} disabled={processing}
                className="px-3 py-1.5 text-xs font-bold text-white bg-green-500 rounded-lg hover:bg-green-600 transition-all disabled:opacity-50">
                Chấp nhận
              </button>
            </>
          )}
          {isOwnerView && status === "return_requested" && (
            <button onClick={() => onDeposit(rental)} disabled={processing}
              className="px-3 py-1.5 text-xs font-bold text-white bg-green-500 rounded-lg hover:bg-green-600 transition-all disabled:opacity-50">
              Xử lý cọc & Hoàn tất
            </button>
          )}
          {isOwnerView && (status === "active" || status === "return_requested") && (
            <button onClick={() => onAction(rental._id, { status: "disputed" })} disabled={processing}
              className="px-3 py-1.5 text-xs font-bold text-purple-600 border border-purple-200 rounded-lg hover:bg-purple-50 transition-all disabled:opacity-50">
              Tranh chấp
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Main ─────────────────────────────────────────────────────────────────────
const Rentals = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // tab 0 = đồ tôi thuê, tab 1 = đồ tôi cho thuê
  const [tab, setTab] = useState(0);
  const [statusFilter, setStatusFilter] = useState("all");
  const [myRentals, setMyRentals] = useState({ requests: [], contracts: [] });
  const [myLendings, setMyLendings] = useState({ requests: [], contracts: [] });
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [extendTarget, setExtendTarget] = useState(null);
  const [depositTarget, setDepositTarget] = useState(null);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [r, l] = await Promise.all([
        rentalService.getMyRentals(),
        rentalService.getMyLendings(),
      ]);
      if (r.success) setMyRentals(r.data);
      if (l.success) setMyLendings(l.data);
    } catch {
      toast.error("Lỗi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  // Gộp requests + contracts, sort mới nhất lên đầu
  const allRentals = useMemo(() => {
    const src = tab === 0 ? myRentals : myLendings;
    const combined = [
      ...(src.requests || []),
      ...(src.contracts || []),
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    if (statusFilter === "all") return combined;
    if (statusFilter === "cancelled") {
      return combined.filter(r => {
        const s = r.requestStatus || r.contractStatus;
        return s === "cancelled" || s === "rejected";
      });
    }
    return combined.filter(r => (r.requestStatus || r.contractStatus) === statusFilter);
  }, [tab, statusFilter, myRentals, myLendings]);

  // Đếm badge cho từng tab
  const rentingCount = useMemo(() => {
    const src = myRentals;
    return [...(src.requests || []), ...(src.contracts || [])].filter(r => {
      const s = r.requestStatus || r.contractStatus;
      return ["pending", "approved", "active", "renting", "return_requested"].includes(s);
    }).length;
  }, [myRentals]);

  const lendingCount = useMemo(() => {
    const src = myLendings;
    return [...(src.requests || []), ...(src.contracts || [])].filter(r => {
      const s = r.requestStatus || r.contractStatus;
      return ["pending", "approved", "active", "renting", "return_requested"].includes(s);
    }).length;
  }, [myLendings]);

  const handleAction = async (id, statusOrPayload) => {
    // Special case: trả đồ
    if (statusOrPayload === "return") {
      setProcessing(true);
      try {
        const res = await rentalService.requestReturn(id);
        if (res.success) { toast.success("Đã gửi yêu cầu trả đồ!"); fetchAll(); }
      } catch (err) {
        toast.error(err.response?.data?.message || "Lỗi");
      } finally { setProcessing(false); }
      return;
    }
    // Special case: xác nhận/từ chối gia hạn
    if (statusOrPayload === "extend_approve" || statusOrPayload === "extend_reject") {
      setProcessing(true);
      try {
        const action = statusOrPayload === "extend_approve" ? "approve" : "reject";
        const res = await rentalService.confirmExtend(id, action);
        if (res.success) {
          toast.success(action === "approve" ? "Đã chấp nhận gia hạn!" : "Đã từ chối gia hạn");
          fetchAll();
        }
      } catch (err) {
        toast.error(err.response?.data?.message || "Lỗi");
      } finally { setProcessing(false); }
      return;
    }
    setProcessing(true);
    try {
      const res = await rentalService.updateRentalStatus(id, statusOrPayload);
      if (res.success) { toast.success("Cập nhật thành công!"); fetchAll(); }
    } catch (err) {
      toast.error(err.response?.data?.message || "Lỗi cập nhật");
    } finally { setProcessing(false); }
  };

  return (
    <div className="flex min-h-screen bg-[#F5F5F7] font-sans">
      <Sidebar variant="user" />

      <main className="flex-1 md:ml-64 px-4 md:px-8 py-8">
        <div className="max-w-4xl mx-auto">

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-green-500 text-3xl">handshake</span>
              Quản lý Thuê Mượn
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Xin chào <strong>{user?.fullName || user?.name}</strong> — theo dõi tất cả giao dịch thuê mượn của bạn.
            </p>
          </div>

          {/* Tabs chính */}
          <div className="flex gap-2 mb-6 bg-white rounded-2xl p-1.5 shadow-sm border border-gray-100 w-fit">
            {[
              { label: "Đồ tôi đang thuê", count: rentingCount },
              { label: "Đồ tôi cho thuê",  count: lendingCount },
            ].map((t, i) => (
              <button key={i} onClick={() => { setTab(i); setStatusFilter("all"); }}
                className={`relative px-5 py-2 rounded-xl text-sm font-bold transition-all ${
                  tab === i
                    ? "bg-green-500 text-white shadow-sm"
                    : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
                }`}>
                {t.label}
                {t.count > 0 && (
                  <span className={`absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full text-[10px] font-black flex items-center justify-center ${
                    tab === i ? "bg-white text-green-600" : "bg-red-500 text-white"
                  }`}>
                    {t.count > 9 ? "9+" : t.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Bộ lọc trạng thái */}
          <div className="flex gap-2 flex-wrap mb-6">
            {STATUS_FILTERS.map(f => (
              <button key={f.value} onClick={() => setStatusFilter(f.value)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                  statusFilter === f.value
                    ? "bg-gray-800 text-white border-gray-800"
                    : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
                }`}>
                {f.label}
              </button>
            ))}
          </div>

          {/* Nội dung */}
          {loading ? (
            <div className="flex justify-center py-20">
              <span className="material-symbols-outlined text-green-400 text-5xl animate-spin">refresh</span>
            </div>
          ) : allRentals.length === 0 ? (
            <div className="bg-white rounded-2xl py-16 text-center border border-gray-100">
              <span className="material-symbols-outlined text-5xl text-gray-200 block mb-3">receipt_long</span>
              <p className="font-semibold text-gray-500">
                {statusFilter === "all"
                  ? (tab === 0 ? "Bạn chưa thuê đồ nào" : "Chưa có ai thuê đồ của bạn")
                  : "Không có giao dịch nào ở trạng thái này"}
              </p>
              {tab === 0 && statusFilter === "all" && (
                <button onClick={() => navigate("/cho-thue")}
                  className="mt-4 px-5 py-2 bg-green-500 text-white rounded-xl text-sm font-bold hover:bg-green-600 transition-all">
                  Tìm đồ để thuê
                </button>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {allRentals.map(rental => (
                <RentalCard
                  key={rental._id}
                  rental={rental}
                  isOwnerView={tab === 1}
                  processing={processing}
                  onAction={handleAction}
                  onExtend={setExtendTarget}
                  onDeposit={setDepositTarget}
                  onView={(id) => navigate(`/thue-muon/${id}`)}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {extendTarget && (
        <ExtendModal contract={extendTarget} onClose={() => setExtendTarget(null)} onSuccess={fetchAll} />
      )}
      {depositTarget && (
        <DepositModal contract={depositTarget} onClose={() => setDepositTarget(null)} onSuccess={fetchAll} />
      )}
    </div>
  );
};

export default Rentals;
