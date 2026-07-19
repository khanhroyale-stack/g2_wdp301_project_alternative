import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import EcoTradeLayout from "../../components/ecotrade/EcoTradeLayout";
import useRealtimeRefresh from "../../hooks/useRealtimeRefresh";
import { useAuth } from "../../context/AuthContext";
import rentalService from "../../services/rental.service";

const STATUS_MAP = {
  pending: { label: "Chờ xác nhận", color: "border-orange-200 bg-orange-50 text-orange-700" },
  approved: { label: "Đã xác nhận", color: "border-blue-200 bg-blue-50 text-blue-700" },
  active: { label: "Chờ nhận đồ", color: "border-sky-200 bg-sky-50 text-sky-700" },
  renting: { label: "Đang thuê", color: "border-green-200 bg-green-50 text-green-700" },
  return_requested: { label: "Chờ trả đồ", color: "border-amber-200 bg-amber-50 text-amber-700" },
  completed: { label: "Hoàn tất", color: "border-teal-200 bg-teal-50 text-teal-700" },
  cancelled: { label: "Đã hủy", color: "border-gray-200 bg-gray-50 text-gray-600" },
  rejected: { label: "Bị từ chối", color: "border-red-200 bg-red-50 text-red-600" },
  disputed: { label: "Tranh chấp", color: "border-purple-200 bg-purple-50 text-purple-700" },
};

const FILTERS = [
  ["all", "Tất cả"],
  ["pending", "Chờ xác nhận"],
  ["active", "Chờ nhận đồ"],
  ["renting", "Đang thuê"],
  ["return_requested", "Chờ trả đồ"],
  ["completed", "Hoàn tất"],
  ["cancelled", "Đã hủy / Từ chối"],
  ["disputed", "Tranh chấp"],
];

const fmt = (value) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value || 0);

const fmtDate = (value) =>
  value ? new Date(value).toLocaleDateString("vi-VN") : "Chưa cập nhật";

const getStatus = (item) => item.requestStatus || item.contractStatus;
const isContract = (item) => Boolean(item.contractStatus);
const getImage = (item) => item.postId?.thumbnailUrl || item.postId?.images?.[0] || item.postId?.imageUrls?.[0];

function ExtendModal({ contract, onClose, onDone }) {
  const [days, setDays] = useState(1);
  const [loading, setLoading] = useState(false);
  const pricePerDay = Number(contract.postId?.rentPricePerDay || 0);
  const oldEnd = new Date(contract.endDate);
  const newEnd = new Date(oldEnd.getTime() + Math.max(days, 1) * 86400000);

  const submit = async () => {
    if (days < 1) return;
    setLoading(true);
    try {
      const res = await rentalService.extendRental(contract._id, days);
      if (res.success) {
        toast.success("Đã gửi yêu cầu gia hạn");
        onDone();
        onClose();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Không thể gửi yêu cầu gia hạn");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <h2 className="text-xl font-extrabold text-gray-900">Yêu cầu gia hạn</h2>
        <p className="mt-1 text-sm text-gray-500">{contract.postId?.title}</p>

        <div className="mt-5 grid gap-3 rounded-xl bg-gray-50 p-4 text-sm">
          <div className="flex justify-between"><span>Ngày kết thúc hiện tại</span><strong>{fmtDate(contract.endDate)}</strong></div>
          <div className="flex justify-between"><span>Ngày kết thúc mới</span><strong>{fmtDate(newEnd)}</strong></div>
          <div className="flex justify-between"><span>Phí dự tính</span><strong className="text-green-600">{fmt(pricePerDay * days)}</strong></div>
        </div>

        <label className="mt-5 block text-sm font-bold text-gray-700">Số ngày muốn gia hạn</label>
        <input
          type="number"
          min={1}
          max={90}
          value={days}
          onChange={(event) => setDays(Math.max(Number(event.target.value) || 1, 1))}
          className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-lg font-bold outline-none focus:border-green-500"
        />

        <div className="mt-6 grid grid-cols-2 gap-3">
          <button onClick={onClose} className="rounded-xl border border-gray-200 py-3 font-bold text-gray-600">Hủy</button>
          <button onClick={submit} disabled={loading} className="rounded-xl bg-green-600 py-3 font-bold text-white disabled:opacity-60">
            {loading ? "Đang gửi..." : "Gửi yêu cầu"}
          </button>
        </div>
      </div>
    </div>
  );
}

function DepositModal({ contract, onClose, onDone }) {
  const [compensationAmount, setCompensationAmount] = useState(0);
  const [compensationReason, setCompensationReason] = useState("");
  const [loading, setLoading] = useState(false);
  const refund = Math.max(0, Number(contract.depositAmount || 0) - Number(compensationAmount || 0));

  const submit = async () => {
    setLoading(true);
    try {
      const res = await rentalService.resolveDeposit(contract._id, { compensationAmount, compensationReason });
      if (res.success) {
        toast.success("Đã xử lý cọc và hoàn tất hợp đồng");
        onDone();
        onClose();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Không thể xử lý cọc");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <h2 className="text-xl font-extrabold text-gray-900">Xử lý cọc</h2>
        <p className="mt-1 text-sm text-gray-500">{contract.postId?.title}</p>
        <div className="mt-5 rounded-xl bg-gray-50 p-4 text-sm">
          <div className="flex justify-between"><span>Tiền cọc</span><strong>{fmt(contract.depositAmount)}</strong></div>
          <div className="mt-2 flex justify-between"><span>Hoàn lại</span><strong className="text-green-600">{fmt(refund)}</strong></div>
        </div>
        <label className="mt-5 block text-sm font-bold text-gray-700">Tiền bồi thường</label>
        <input
          type="number"
          min={0}
          max={contract.depositAmount || 0}
          value={compensationAmount}
          onChange={(event) => setCompensationAmount(Math.max(Number(event.target.value) || 0, 0))}
          className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 font-bold outline-none focus:border-green-500"
        />
        <label className="mt-4 block text-sm font-bold text-gray-700">Lý do trừ cọc</label>
        <textarea
          value={compensationReason}
          onChange={(event) => setCompensationReason(event.target.value)}
          rows={3}
          className="mt-2 w-full resize-none rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-green-500"
          placeholder="Ví dụ: trầy xước, thiếu phụ kiện..."
        />
        <div className="mt-6 grid grid-cols-2 gap-3">
          <button onClick={onClose} className="rounded-xl border border-gray-200 py-3 font-bold text-gray-600">Hủy</button>
          <button onClick={submit} disabled={loading} className="rounded-xl bg-green-600 py-3 font-bold text-white disabled:opacity-60">
            {loading ? "Đang xử lý..." : "Hoàn tất"}
          </button>
        </div>
      </div>
    </div>
  );
}

function RentalCard({ item, ownerView, onAction, onExtend, onDeposit, onView, processing }) {
  const status = getStatus(item);
  const statusInfo = STATUS_MAP[status] || { label: status, color: "border-gray-200 bg-gray-50 text-gray-600" };
  const party = ownerView ? item.renterId : item.ownerId;
  const image = getImage(item);
  const days = Math.max(1, Math.ceil((new Date(item.endDate) - new Date(item.startDate)) / 86400000));

  return (
    <article className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
      <div className="flex gap-4 p-5">
        <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-gray-50">
          {image ? <img src={image} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-gray-300">image</div>}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <h3 className="line-clamp-2 font-bold text-gray-900">{item.postId?.title || "Sản phẩm không xác định"}</h3>
            <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase ${statusInfo.color}`}>{statusInfo.label}</span>
          </div>
          <p className="mt-2 text-sm text-gray-500">
            {fmtDate(item.startDate)} - {fmtDate(item.endDate)} · {days} ngày
          </p>
          <p className="mt-1 text-sm text-gray-500">
            {ownerView ? "Người thuê" : "Chủ đồ"}: <strong className="text-gray-800">{party?.fullName || party?.name || "Chưa cập nhật"}</strong>
          </p>
        </div>
      </div>

      <div className="mx-5 grid grid-cols-3 rounded-xl bg-gray-50 p-3 text-center text-xs">
        <div><p className="text-gray-400">Tiền thuê</p><strong>{fmt(item.rentalFee)}</strong></div>
        <div className="border-x border-gray-200"><p className="text-gray-400">Tiền cọc</p><strong>{fmt(item.depositAmount)}</strong></div>
        <div><p className="text-gray-400">Tổng</p><strong className="text-green-600">{fmt((item.rentalFee || 0) + (item.depositAmount || 0))}</strong></div>
      </div>

      {isContract(item) && item.extendStatus === "pending" ? (
        <div className="mx-5 mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          Đang chờ duyệt gia hạn {item.pendingExtendDays} ngày, dự kiến đến {fmtDate(item.lastExtendNewEndDate || new Date(new Date(item.endDate).getTime() + item.pendingExtendDays * 86400000))}.
        </div>
      ) : null}

      {isContract(item) && item.extendStatus === "approved" && item.lastExtendDays > 0 ? (
        <div className="mx-5 mt-3 rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-700">
          Đã gia hạn thêm {item.lastExtendDays} ngày, ngày kết thúc mới: {fmtDate(item.lastExtendNewEndDate || item.endDate)}.
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-gray-50 px-5 py-3">
        <span className="text-xs font-mono text-gray-400">{isContract(item) ? "HĐ" : "YC"}#{String(item._id).slice(-8).toUpperCase()}</span>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => onView(item._id)} className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-bold text-gray-600 hover:bg-gray-50">
            Chi tiết
          </button>

          {!ownerView && status === "pending" ? (
            <button disabled={processing} onClick={() => onAction(item._id, "cancelled")} className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50 disabled:opacity-50">
              Hủy yêu cầu
            </button>
          ) : null}

          {!ownerView && status === "active" ? (
            <button disabled={processing} onClick={() => onAction(item._id, "renting")} className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50">
              Xác nhận đã nhận đồ
            </button>
          ) : null}

          {!ownerView && status === "renting" ? (
            <>
              <button disabled={processing || item.extendStatus === "pending"} onClick={() => onExtend(item)} className="rounded-lg border border-blue-200 px-3 py-1.5 text-xs font-bold text-blue-700 hover:bg-blue-50 disabled:opacity-50">
                Yêu cầu gia hạn
              </button>
              <button disabled={processing} onClick={() => onAction(item._id, "return")} className="rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50">
                Trả đồ
              </button>
            </>
          ) : null}

          {ownerView && status === "pending" ? (
            <>
              <button disabled={processing} onClick={() => onAction(item._id, { status: "rejected" })} className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50 disabled:opacity-50">Từ chối</button>
              <button disabled={processing} onClick={() => onAction(item._id, { status: "approved" })} className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50">Chấp nhận</button>
            </>
          ) : null}

          {ownerView && item.extendStatus === "pending" ? (
            <>
              <button disabled={processing} onClick={() => onAction(item._id, "extend_reject")} className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50 disabled:opacity-50">Từ chối gia hạn</button>
              <button disabled={processing} onClick={() => onAction(item._id, "extend_approve")} className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50">Duyệt gia hạn</button>
            </>
          ) : null}

          {ownerView && status === "return_requested" ? (
            <button disabled={processing} onClick={() => onDeposit(item)} className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50">
              Xử lý cọc
            </button>
          ) : null}
        </div>
      </div>
    </article>
  );
}

export default function Rentals() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState(0);
  const [statusFilter, setStatusFilter] = useState("all");
  const [myRentals, setMyRentals] = useState({ requests: [], contracts: [] });
  const [myLendings, setMyLendings] = useState({ requests: [], contracts: [] });
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [extendTarget, setExtendTarget] = useState(null);
  const [depositTarget, setDepositTarget] = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [rentalsRes, lendingsRes] = await Promise.all([
        rentalService.getMyRentals(),
        rentalService.getMyLendings(),
      ]);
      if (rentalsRes.success) setMyRentals(rentalsRes.data);
      if (lendingsRes.success) setMyLendings(lendingsRes.data);
    } catch {
      toast.error("Không thể tải danh sách thuê");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);
  useRealtimeRefresh("rental", fetchAll);

  const currentItems = useMemo(() => {
    const source = tab === 0 ? myRentals : myLendings;
    const combined = [...(source.requests || []), ...(source.contracts || [])]
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    if (statusFilter === "all") return combined;
    if (statusFilter === "cancelled") {
      return combined.filter((item) => ["cancelled", "rejected"].includes(getStatus(item)));
    }
    return combined.filter((item) => getStatus(item) === statusFilter);
  }, [myLendings, myRentals, statusFilter, tab]);

  const counters = useMemo(() => {
    const countActive = (source) =>
      [...(source.requests || []), ...(source.contracts || [])]
        .filter((item) => ["pending", "approved", "active", "renting", "return_requested"].includes(getStatus(item))).length;
    return [countActive(myRentals), countActive(myLendings)];
  }, [myLendings, myRentals]);

  const handleAction = async (id, payload) => {
    setProcessing(true);
    try {
      let res;
      if (payload === "return") {
        res = await rentalService.requestReturn(id);
        toast.success("Đã gửi yêu cầu trả đồ");
      } else if (payload === "extend_approve" || payload === "extend_reject") {
        res = await rentalService.confirmExtend(id, payload === "extend_approve" ? "approve" : "reject");
        toast.success(payload === "extend_approve" ? "Đã duyệt gia hạn" : "Đã từ chối gia hạn");
      } else {
        res = await rentalService.updateRentalStatus(id, payload);
        toast.success("Đã cập nhật trạng thái");
      }
      if (res?.success) fetchAll();
    } catch (error) {
      toast.error(error.response?.data?.message || "Không thể cập nhật");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <EcoTradeLayout>
      <div className="mx-auto max-w-5xl px-4 md:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-extrabold text-gray-900">Quản lý thuê mượn</h1>
          <p className="mt-1 text-sm text-gray-500">Xin chào <strong>{user?.fullName || user?.name}</strong>, theo dõi yêu cầu thuê, hợp đồng, gia hạn và trả đồ tại đây.</p>
        </div>

        <div className="mb-6 flex w-fit gap-2 rounded-2xl border border-gray-100 bg-white p-1.5 shadow-sm">
          {[
            ["Đồ tôi thuê", counters[0]],
            ["Đồ tôi cho thuê", counters[1]],
          ].map(([label, count], index) => (
            <button
              key={label}
              onClick={() => { setTab(index); setStatusFilter("all"); }}
              className={`relative rounded-xl px-5 py-2 text-sm font-bold transition ${tab === index ? "bg-green-600 text-white" : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"}`}
            >
              {label}
              {count > 0 ? <span className="ml-2 rounded-full bg-white/90 px-1.5 text-[10px] text-green-700">{count > 9 ? "9+" : count}</span> : null}
            </button>
          ))}
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
          {FILTERS.map(([value, label]) => (
            <button
              key={value}
              onClick={() => setStatusFilter(value)}
              className={`rounded-full border px-3 py-1.5 text-xs font-bold transition ${statusFilter === value ? "border-gray-900 bg-gray-900 text-white" : "border-gray-200 bg-white text-gray-600 hover:border-gray-400"}`}
            >
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><span className="material-symbols-outlined animate-spin text-5xl text-green-500">refresh</span></div>
        ) : currentItems.length === 0 ? (
          <div className="rounded-2xl border border-gray-100 bg-white py-16 text-center">
            <span className="material-symbols-outlined block text-5xl text-gray-200">receipt_long</span>
            <p className="mt-3 font-semibold text-gray-500">{tab === 0 ? "Bạn chưa có giao dịch thuê nào" : "Chưa có ai thuê đồ của bạn"}</p>
            {tab === 0 ? <button onClick={() => navigate("/cho-thue")} className="mt-4 rounded-xl bg-green-600 px-5 py-2 text-sm font-bold text-white">Tìm đồ để thuê</button> : null}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {currentItems.map((item) => (
              <RentalCard
                key={item._id}
                item={item}
                ownerView={tab === 1}
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

      {extendTarget ? <ExtendModal contract={extendTarget} onClose={() => setExtendTarget(null)} onDone={fetchAll} /> : null}
      {depositTarget ? <DepositModal contract={depositTarget} onClose={() => setDepositTarget(null)} onDone={fetchAll} /> : null}
    </EcoTradeLayout>
  );
}
