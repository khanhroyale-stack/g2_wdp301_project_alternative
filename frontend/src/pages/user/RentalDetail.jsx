import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import EcoTradeLayout from "../../components/ecotrade/EcoTradeLayout";
import useRealtimeRefresh from "../../hooks/useRealtimeRefresh";
import rentalService from "../../services/rental.service";
import toast from "react-hot-toast";

const STATUS_MAP = {
  pending:          { label: "Chờ xác nhận",   color: "text-orange-600 bg-orange-50 border-orange-200" },
  approved:         { label: "Đã xác nhận",     color: "text-blue-600 bg-blue-50 border-blue-200" },
  active:           { label: "Đang thuê",       color: "text-green-600 bg-green-50 border-green-200" },
  return_requested: { label: "Chờ nhận lại đồ", color: "text-yellow-700 bg-yellow-50 border-yellow-200" },
  completed:        { label: "Hoàn tất",        color: "text-teal-600 bg-teal-50 border-teal-200" },
  cancelled:        { label: "Đã hủy",          color: "text-red-600 bg-red-50 border-red-200" },
  rejected:         { label: "Bị từ chối",      color: "text-red-600 bg-red-50 border-red-200" },
  disputed:         { label: "Tranh chấp",      color: "text-purple-600 bg-purple-50 border-purple-200" },
};

const formatPrice = (n) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n || 0);

const formatDate = (d) =>
  new Date(d).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });

const getImageUrl = (img) => {
  if (!img) return "https://placehold.co/400?text=No+Image";
  return img;
};

const InfoRow = ({ label, value }) => (
  <div className="flex flex-col gap-1 py-3 border-b border-gray-100 last:border-0 sm:flex-row sm:justify-between sm:gap-6">
    <span className="text-sm text-gray-500 sm:w-40 sm:flex-shrink-0">{label}</span>
    <span className="text-sm font-semibold text-gray-800 break-words sm:text-right">{value}</span>
  </div>
);

const DetailItem = ({ icon, label, value, full = false }) => (
  <div className={`rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 ${full ? "sm:col-span-2" : ""}`}>
    <div className="mb-1 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-gray-400">
      {icon ? <span className="material-symbols-outlined text-[15px]">{icon}</span> : null}
      {label}
    </div>
    <div className="whitespace-pre-wrap break-words text-sm font-semibold leading-6 text-gray-900">
      {value || "—"}
    </div>
  </div>
);

const parseRentalNote = (note = "") => {
  const read = (label) => note.match(new RegExp(`\\[${label}: ([^\\]]*)\\]`))?.[1]?.trim() || "";
  const explicitNote = note.match(/\|\s*Ghi chú:\s*([\s\S]*)$/)?.[1]?.trim() || "";

  return {
    cccd: read("CCCD"),
    phone: read("SĐT"),
    address: read("Địa chỉ"),
    renterNote: explicitNote || (!note.includes("[CCCD:") ? note : ""),
  };
};

const RentalDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await rentalService.getRental(id);
      if (res.success) setData(res.data);
      else toast.error("Không tìm thấy");
    } catch {
      toast.error("Lỗi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);
  useRealtimeRefresh("rental", load);

  if (loading) {
    return (
      <EcoTradeLayout>
        <div className="flex-1 flex items-center justify-center min-h-[50vh]">
          <span className="material-symbols-outlined text-5xl text-green-400 animate-spin">refresh</span>
        </div>
      </EcoTradeLayout>
    );
  }

  if (!data) return null;

  const status = data.requestStatus || data.contractStatus;
  const s = STATUS_MAP[status] || { label: status, color: "text-gray-600 bg-gray-50 border-gray-200" };
  const isContract = !!data.contractStatus;
  const product = data.postId;
  const totalDays = Math.max(1, Math.ceil((new Date(data.endDate) - new Date(data.startDate)) / 86400000));
  const rentalNote = parseRentalNote(data.note);
  const productImage = product?.thumbnailUrl || product?.images?.[0] || product?.imageUrls?.[0];

  return (
    <EcoTradeLayout>
      <div className="px-4 md:px-10">

          {/* Back */}
          <button
            onClick={() => navigate("/thue-muon")}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-6 transition-colors">
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Quay lại
          </button>

          {/* Title */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-extrabold text-gray-900">
                {isContract ? "Chi tiết hợp đồng" : "Chi tiết yêu cầu thuê"}
              </h1>
              <p className="text-sm text-gray-400 font-mono mt-1">{id}</p>
            </div>
            <span className={`text-xs px-4 py-2 rounded-full font-bold uppercase tracking-wider border ${s.color}`}>
              {s.label}
            </span>
          </div>

          <div className="grid gap-6">
            {/* Product card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex gap-5">
              <div className="w-24 h-24 rounded-xl overflow-hidden flex-shrink-0 bg-gray-50">
                <img
                  src={getImageUrl(productImage)}
                  alt={product?.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1">
                <h2 className="font-bold text-lg text-gray-900 mb-1">{product?.title || "—"}</h2>
                <p className="text-sm text-gray-500">{product?.location || ""}</p>
                <p className="text-sm text-green-600 font-bold mt-2">
                  {formatPrice(product?.rentPricePerDay)}/ngày
                </p>
              </div>
            </div>

            {/* Thông tin thuê */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-bold text-gray-800 mb-4">Thông tin thuê</h3>
              <InfoRow label="Ngày bắt đầu" value={formatDate(data.startDate)} />
              <InfoRow label="Ngày kết thúc" value={formatDate(data.endDate)} />
              <InfoRow label="Số ngày thuê" value={`${totalDays} ngày`} />
              <InfoRow label="Tiền thuê" value={formatPrice(data.rentalFee)} />
              <InfoRow label="Tiền cọc" value={formatPrice(data.depositAmount)} />
              <InfoRow
                label="Tổng cộng"
                value={<span className="text-green-600 font-extrabold">{formatPrice((data.rentalFee || 0) + (data.depositAmount || 0))}</span>}
              />
            </div>

            {/* Các bên */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-bold text-gray-800 mb-4">Các bên liên quan</h3>
              <InfoRow label="Người thuê" value={data.renterId?.fullName || data.renterId?.name || "—"} />
              <InfoRow label="Chủ đồ" value={data.ownerId?.fullName || data.ownerId?.name || "—"} />
              {isContract && data.handoverMethod && (
                <InfoRow
                  label="Hình thức giao nhận"
                  value={data.handoverMethod === "shipping" ? "Giao qua shipper" : "Gặp trực tiếp"}
                />
              )}
            </div>

            {/* Thông tin đăng ký thuê */}
            {data.note && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="font-bold text-gray-800 mb-4">Thông tin đăng ký thuê</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <DetailItem icon="badge" label="CCCD / CMND" value={rentalNote.cccd} />
                  <DetailItem icon="call" label="Số điện thoại" value={rentalNote.phone} />
                  <DetailItem icon="location_on" label="Địa chỉ" value={rentalNote.address} full />
                  {rentalNote.renterNote ? (
                    <DetailItem icon="notes" label="Ghi chú cho chủ đồ" value={rentalNote.renterNote} full />
                  ) : null}
                </div>
              </div>
            )}

            {/* Kết quả cọc (nếu đã xử lý) */}
            {isContract && (data.compensationAmount > 0 || data.depositRefundAmount > 0) && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="font-bold text-gray-800 mb-4">Kết quả xử lý cọc</h3>
                {data.compensationAmount > 0 && (
                  <InfoRow label="Bồi thường" value={<span className="text-red-500">{formatPrice(data.compensationAmount)}</span>} />
                )}
                <InfoRow label="Hoàn cọc" value={<span className="text-green-600">{formatPrice(data.depositRefundAmount)}</span>} />
                {data.accessoriesNote && (
                  <InfoRow label="Lý do" value={data.accessoriesNote} />
                )}
              </div>
            )}
          </div>

          <div className="mt-8 flex justify-end">
            <button
              onClick={() => navigate("/thue-muon")}
              className="px-8 py-3 rounded-xl bg-green-500 text-white font-bold hover:bg-green-600 transition-all">
              Quay lại danh sách
            </button>
          </div>
      </div>
    </EcoTradeLayout>
  );
};

export default RentalDetail;
