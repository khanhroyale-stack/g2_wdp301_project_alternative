import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  CalendarDays,
  Handshake,
  Loader2,
  Package,
  Receipt,
  X,
} from "lucide-react";
import EcoTradeLayout from "../../components/ecotrade/EcoTradeLayout";
import useRealtimeRefresh from "../../hooks/useRealtimeRefresh";
import { useAuth } from "../../context/AuthContext";
import rentalService from "../../services/rental.service";

const STATUS_MAP = {
  pending: { label: "Chờ xác nhận", color: "border-warning/30 bg-warning-soft text-warning" },
  approved: { label: "Đã xác nhận", color: "border-primary/20 bg-primary/10 text-primary" },
  active: { label: "Chờ nhận đồ", color: "border-primary/20 bg-surface-secondary text-primary" },
  renting: { label: "Đang thuê", color: "border-success/25 bg-success-soft text-success" },
  return_requested: { label: "Chờ trả đồ", color: "border-warning/30 bg-warning-soft text-warning" },
  completed: { label: "Hoàn tất", color: "border-success/25 bg-success-soft text-success" },
  cancelled: { label: "Đã hủy", color: "border-border bg-surface-secondary text-muted-foreground" },
  rejected: { label: "Bị từ chối", color: "border-danger/25 bg-danger-soft text-danger" },
};

const FILTERS = [
  ["all", "Tất cả"],
  ["pending", "Chờ xác nhận"],
  ["active", "Chờ nhận đồ"],
  ["renting", "Đang thuê"],
  ["return_requested", "Chờ trả đồ"],
  ["completed", "Hoàn tất"],
  ["cancelled", "Đã hủy / Từ chối"],
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 px-4 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="extend-modal-title"
        className="w-full max-w-md rounded-modal border border-border bg-surface p-6 shadow-card-hover animate-[scaleUp_0.2s_ease-out]"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="extend-modal-title" className="text-xl font-extrabold text-foreground">
              Yêu cầu gia hạn
            </h2>
            <p className="mt-1 text-sm font-medium text-muted-foreground">{contract.postId?.title}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-btn p-2 text-muted transition-all duration-200 hover:bg-surface-secondary hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:scale-[0.98]"
            aria-label="Đóng"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5 grid gap-3 rounded-field bg-surface-secondary p-4 text-sm font-medium">
          <div className="flex justify-between gap-3">
            <span className="text-muted-foreground">Ngày kết thúc hiện tại</span>
            <strong className="text-foreground">{fmtDate(contract.endDate)}</strong>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-muted-foreground">Ngày kết thúc mới</span>
            <strong className="text-foreground">{fmtDate(newEnd)}</strong>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-muted-foreground">Phí dự tính</span>
            <strong className="text-primary">{fmt(pricePerDay * days)}</strong>
          </div>
        </div>

        <label className="mt-5 block text-sm font-bold text-foreground">Số ngày muốn gia hạn</label>
        <input
          type="number"
          min={1}
          max={90}
          value={days}
          onChange={(event) => setDays(Math.max(Number(event.target.value) || 1, 1))}
          className="et-input mt-2 text-lg font-bold"
        />

        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-btn border border-border bg-surface py-3 text-sm font-bold text-muted-foreground transition-all duration-200 hover:-translate-y-[3px] hover:bg-surface-secondary hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:scale-[0.98]"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-btn bg-primary py-3 text-sm font-bold text-white transition-all duration-200 hover:-translate-y-[3px] hover:bg-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Đang gửi...
              </>
            ) : (
              "Gửi yêu cầu"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function RentalCard({ item, ownerView, onAction, onExtend, onView, processing }) {
  const status = getStatus(item);
  const statusInfo = STATUS_MAP[status] || {
    label: status,
    color: "border-border bg-surface-secondary text-muted-foreground",
  };
  const party = ownerView ? item.renterId : item.ownerId;
  const image = getImage(item);
  const days = Math.max(1, Math.ceil((new Date(item.endDate) - new Date(item.startDate)) / 86400000));

  const btnBase =
    "inline-flex items-center justify-center rounded-btn px-3 py-2 text-xs font-bold transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50";

  return (
    <article className="overflow-hidden rounded-card border border-border bg-surface shadow-card transition-all duration-200 ease-out hover:-translate-y-[3px] hover:border-primary/20 hover:shadow-card-hover">
      <div className="flex gap-4 p-5">
        <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-image bg-surface-secondary">
          {image ? (
            <img src={image} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-muted">
              <Package className="h-7 w-7" />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <h3 className="line-clamp-2 font-bold text-foreground">
              {item.postId?.title || "Sản phẩm không xác định"}
            </h3>
            <span className={`et-badge shrink-0 border ${statusInfo.color}`}>
              {statusInfo.label}
            </span>
          </div>
          <p className="mt-2 flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
            <CalendarDays className="h-3.5 w-3.5 shrink-0" />
            {fmtDate(item.startDate)} - {fmtDate(item.endDate)} · {days} ngày
          </p>
          <p className="mt-1 text-sm font-medium text-muted-foreground">
            {ownerView ? "Người thuê" : "Chủ đồ"}:{" "}
            <strong className="font-semibold text-foreground">
              {party?.fullName || party?.name || "Chưa cập nhật"}
            </strong>
          </p>
        </div>
      </div>

      <div className="mx-5 grid grid-cols-2 rounded-field bg-surface-secondary p-3 text-center text-xs">
        <div>
          <p className="font-medium text-muted">Tiền thuê</p>
          <strong className="text-sm text-foreground">{fmt(item.rentalFee)}</strong>
        </div>
        <div>
          <p className="font-medium text-muted">Tổng</p>
          <strong className="text-sm text-primary">{fmt(item.rentalFee)}</strong>
        </div>
      </div>

      {isContract(item) && item.extendStatus === "pending" ? (
        <div className="mx-5 mt-3 rounded-field border border-warning/30 bg-warning-soft p-3 text-sm font-medium text-warning">
          Đang chờ duyệt gia hạn {item.pendingExtendDays} ngày, dự kiến đến{" "}
          {fmtDate(
            item.lastExtendNewEndDate ||
              new Date(new Date(item.endDate).getTime() + item.pendingExtendDays * 86400000)
          )}
          .
        </div>
      ) : null}

      {isContract(item) && item.extendStatus === "approved" && item.lastExtendDays > 0 ? (
        <div className="mx-5 mt-3 rounded-field border border-success/25 bg-success-soft p-3 text-sm font-medium text-success">
          Đã gia hạn thêm {item.lastExtendDays} ngày, ngày kết thúc mới:{" "}
          {fmtDate(item.lastExtendNewEndDate || item.endDate)}.
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border px-5 py-4">
        <span className="font-mono text-[11px] font-medium text-muted">
          {isContract(item) ? "HĐ" : "YC"}#{String(item._id).slice(-8).toUpperCase()}
        </span>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onView(item._id)}
            className={`${btnBase} border border-border bg-surface text-muted-foreground hover:-translate-y-[3px] hover:border-primary/30 hover:bg-surface-secondary hover:text-primary`}
          >
            Chi tiết
          </button>

          {!ownerView && status === "pending" ? (
            <button
              type="button"
              disabled={processing}
              onClick={() => onAction(item._id, "cancelled")}
              className={`${btnBase} border border-danger/25 bg-surface text-danger hover:-translate-y-[3px] hover:bg-danger-soft`}
            >
              Hủy yêu cầu
            </button>
          ) : null}

          {!ownerView && status === "active" ? (
            <button
              type="button"
              disabled={processing}
              onClick={() => onAction(item._id, "renting")}
              className={`${btnBase} bg-primary text-white hover:-translate-y-[3px] hover:bg-primary-hover`}
            >
              {processing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
              Xác nhận đã nhận đồ
            </button>
          ) : null}

          {!ownerView && status === "renting" ? (
            <>
              <button
                type="button"
                disabled={processing || item.extendStatus === "pending"}
                onClick={() => onExtend(item)}
                className={`${btnBase} border border-primary/25 bg-surface text-primary hover:-translate-y-[3px] hover:bg-surface-secondary disabled:hover:translate-y-0`}
              >
                Yêu cầu gia hạn
              </button>
              <button
                type="button"
                disabled={processing}
                onClick={() => onAction(item._id, "return")}
                className={`${btnBase} bg-warning text-white hover:-translate-y-[3px] hover:brightness-95`}
              >
                Trả đồ
              </button>
            </>
          ) : null}

          {ownerView && status === "pending" ? (
            <>
              <button
                type="button"
                disabled={processing}
                onClick={() => onAction(item._id, { status: "rejected" })}
                className={`${btnBase} border border-danger/25 bg-surface text-danger hover:-translate-y-[3px] hover:bg-danger-soft`}
              >
                Từ chối
              </button>
              <button
                type="button"
                disabled={processing}
                onClick={() => onAction(item._id, { status: "approved" })}
                className={`${btnBase} bg-primary text-white hover:-translate-y-[3px] hover:bg-primary-hover`}
              >
                Chấp nhận
              </button>
            </>
          ) : null}

          {ownerView && item.extendStatus === "pending" ? (
            <>
              <button
                type="button"
                disabled={processing}
                onClick={() => onAction(item._id, "extend_reject")}
                className={`${btnBase} border border-danger/25 bg-surface text-danger hover:-translate-y-[3px] hover:bg-danger-soft`}
              >
                Từ chối gia hạn
              </button>
              <button
                type="button"
                disabled={processing}
                onClick={() => onAction(item._id, "extend_approve")}
                className={`${btnBase} bg-primary text-white hover:-translate-y-[3px] hover:bg-primary-hover`}
              >
                Duyệt gia hạn
              </button>
            </>
          ) : null}

          {ownerView && status === "return_requested" ? (
            <button
              type="button"
              disabled={processing}
              onClick={() => onAction(item._id, { status: "completed" })}
              className={`${btnBase} bg-primary text-white hover:-translate-y-[3px] hover:bg-primary-hover`}
            >
              Xác nhận đã nhận đồ & hoàn tất
            </button>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function RentalsSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="overflow-hidden rounded-card border border-border bg-surface shadow-card">
          <div className="flex gap-4 p-5">
            <div className="h-20 w-20 shrink-0 animate-pulse rounded-image bg-surface-secondary" />
            <div className="flex-1 space-y-3">
              <div className="h-5 w-3/4 animate-pulse rounded-btn bg-surface-secondary" />
              <div className="h-4 w-1/2 animate-pulse rounded-btn bg-surface-secondary" />
              <div className="h-4 w-2/5 animate-pulse rounded-btn bg-surface-secondary" />
            </div>
          </div>
          <div className="mx-5 mb-4 h-14 animate-pulse rounded-field bg-surface-secondary" />
          <div className="flex justify-between border-t border-border px-5 py-4">
            <div className="h-4 w-24 animate-pulse rounded-btn bg-surface-secondary" />
            <div className="flex gap-2">
              <div className="h-8 w-20 animate-pulse rounded-btn bg-surface-secondary" />
              <div className="h-8 w-24 animate-pulse rounded-btn bg-surface-secondary" />
            </div>
          </div>
        </div>
      ))}
    </div>
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
      <div className="mx-auto w-full max-w-5xl font-sans">
        <div className="mb-8">
          <div className="mb-3 inline-flex items-center gap-1.5 rounded-pill border border-border bg-surface px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-primary shadow-card">
            <Handshake className="h-3.5 w-3.5" />
            Thuê & mượn
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
            Quản lý thuê mượn
          </h1>
          <p className="mt-2 text-sm font-medium text-muted-foreground">
            Xin chào <strong className="font-semibold text-foreground">{user?.fullName || user?.name}</strong>, theo dõi yêu cầu thuê, hợp đồng, gia hạn và trả đồ tại đây.
          </p>
        </div>

        <div className="mb-6 flex w-fit gap-1.5 rounded-card border border-border bg-surface p-1.5 shadow-card">
          {[
            ["Đồ tôi thuê", counters[0]],
            ["Đồ tôi cho thuê", counters[1]],
          ].map(([label, count], index) => (
            <button
              key={label}
              type="button"
              onClick={() => { setTab(index); setStatusFilter("all"); }}
              className={`relative rounded-btn px-5 py-2.5 text-sm font-bold transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:scale-[0.98] ${
                tab === index
                  ? "bg-primary text-white shadow-card"
                  : "text-muted-foreground hover:bg-surface-secondary hover:text-primary"
              }`}
            >
              {label}
              {count > 0 ? (
                <span
                  className={`ml-2 rounded-pill px-1.5 py-0.5 text-[10px] font-extrabold ${
                    tab === index ? "bg-white/95 text-primary" : "bg-surface-secondary text-primary"
                  }`}
                >
                  {count > 9 ? "9+" : count}
                </span>
              ) : null}
            </button>
          ))}
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
          {FILTERS.map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setStatusFilter(value)}
              className={`rounded-pill border px-3.5 py-2 text-xs font-bold transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:scale-[0.98] ${
                statusFilter === value
                  ? "border-primary bg-primary text-white shadow-card"
                  : "border-border bg-surface text-muted-foreground hover:border-primary/40 hover:text-primary"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <RentalsSkeleton />
        ) : currentItems.length === 0 ? (
          <div className="rounded-card border border-dashed border-border bg-surface py-16 text-center shadow-card">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-card bg-surface-secondary">
              <Receipt className="h-8 w-8 text-muted" />
            </div>
            <p className="font-semibold text-muted-foreground">
              {tab === 0 ? "Bạn chưa có giao dịch thuê nào" : "Chưa có ai thuê đồ của bạn"}
            </p>
            {tab === 0 ? (
              <button
                type="button"
                onClick={() => navigate("/cho-thue")}
                className="et-btn-primary mt-5 hover:-translate-y-[3px]"
              >
                Tìm đồ để thuê
              </button>
            ) : null}
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
                onView={(id) => navigate(`/thue-muon/${id}`)}
              />
            ))}
          </div>
        )}
      </div>

      {extendTarget ? (
        <ExtendModal
          contract={extendTarget}
          onClose={() => setExtendTarget(null)}
          onDone={fetchAll}
        />
      ) : null}
    </EcoTradeLayout>
  );
}
