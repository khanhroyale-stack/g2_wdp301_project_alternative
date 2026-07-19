import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import EcoTradeLayout from "../../components/ecotrade/EcoTradeLayout";
import useRealtimeRefresh from "../../hooks/useRealtimeRefresh";
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

const fmt = (value) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value || 0);

const fmtDate = (value) =>
  value ? new Date(value).toLocaleDateString("vi-VN") : "Chưa cập nhật";

const fmtDateTime = (value) =>
  value ? new Date(value).toLocaleString("vi-VN") : "Chưa cập nhật";

const getImage = (product) =>
  product?.thumbnailUrl || product?.images?.[0] || product?.imageUrls?.[0] || "https://placehold.co/500x360?text=EcoTrade";

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

function InfoRow({ label, value, strong = false }) {
  return (
    <div className="flex flex-col gap-1 border-b border-gray-100 py-3 last:border-0 sm:flex-row sm:justify-between sm:gap-6">
      <span className="text-sm text-gray-500">{label}</span>
      <span className={`whitespace-pre-wrap break-words text-sm sm:text-right ${strong ? "font-extrabold text-green-700" : "font-semibold text-gray-900"}`}>
        {value || "Chưa cập nhật"}
      </span>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-extrabold text-gray-900">{title}</h2>
      {children}
    </section>
  );
}

export default function RentalDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await rentalService.getRental(id);
      if (res.success) {
        setData(res.data);
      } else {
        toast.error("Không tìm thấy giao dịch thuê");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Không thể tải chi tiết thuê");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);
  useRealtimeRefresh("rental", load);

  const noteInfo = useMemo(() => parseRentalNote(data?.note || ""), [data?.note]);

  if (loading) {
    return (
      <EcoTradeLayout>
        <div className="flex min-h-[50vh] items-center justify-center">
          <span className="material-symbols-outlined animate-spin text-5xl text-green-500">refresh</span>
        </div>
      </EcoTradeLayout>
    );
  }

  if (!data) return null;

  const product = data.postId || {};
  const status = data.requestStatus || data.contractStatus;
  const statusInfo = STATUS_MAP[status] || { label: status, color: "border-gray-200 bg-gray-50 text-gray-600" };
  const contract = Boolean(data.contractStatus);
  const totalDays = Math.max(1, Math.ceil((new Date(data.endDate) - new Date(data.startDate)) / 86400000));
  const pendingNewEnd = data.pendingExtendDays
    ? new Date(new Date(data.endDate).getTime() + data.pendingExtendDays * 86400000)
    : null;

  return (
    <EcoTradeLayout>
      <div className="mx-auto max-w-5xl px-4 md:px-8">
        <button onClick={() => navigate("/thue-muon")} className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-900">
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Quay lại danh sách
        </button>

        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900">
              {contract ? "Chi tiết hợp đồng thuê" : "Chi tiết yêu cầu thuê"}
            </h1>
            <p className="mt-1 font-mono text-xs text-gray-400">{id}</p>
          </div>
          <span className={`w-fit rounded-full border px-4 py-2 text-xs font-extrabold uppercase ${statusInfo.color}`}>
            {statusInfo.label}
          </span>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <Section title="Sản phẩm thuê">
              <div className="flex gap-5">
                <img src={getImage(product)} alt={product.title || "Sản phẩm"} className="h-28 w-28 rounded-xl object-cover" />
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg font-extrabold text-gray-900">{product.title || "Sản phẩm không xác định"}</h2>
                  <p className="mt-1 text-sm text-gray-500">{product.location || "Khu vực Hòa Lạc"}</p>
                  <p className="mt-3 text-sm font-bold text-green-700">{fmt(product.rentPricePerDay)}/ngày</p>
                </div>
              </div>
            </Section>

            <Section title="Thông tin người thuê đã nhập">
              <InfoRow label="Người thuê" value={data.renterId?.fullName || data.renterId?.name} />
              <InfoRow label="Số điện thoại" value={noteInfo.phone || data.renterId?.phone} />
              <InfoRow label="CCCD / CMND" value={noteInfo.cccd} />
              <InfoRow label="Địa chỉ thường trú" value={noteInfo.address} />
              <InfoRow label="Ghi chú cho chủ đồ" value={noteInfo.renterNote} />
            </Section>

            <Section title="Các bên liên quan">
              <InfoRow label="Chủ đồ" value={data.ownerId?.fullName || data.ownerId?.name} />
              <InfoRow label="Người thuê" value={data.renterId?.fullName || data.renterId?.name} />
              {contract ? (
                <InfoRow label="Hình thức giao nhận" value={data.handoverMethod === "shipping" ? "Giao qua shipper" : "Gặp trực tiếp"} />
              ) : null}
            </Section>
          </div>

          <div className="space-y-6">
            <Section title="Thời gian và chi phí thuê">
              <InfoRow label="Ngày bắt đầu" value={fmtDate(data.startDate)} />
              <InfoRow label="Ngày kết thúc" value={fmtDate(data.endDate)} />
              <InfoRow label="Số ngày thuê" value={`${totalDays} ngày`} />
              <InfoRow label="Tiền thuê" value={fmt(data.rentalFee)} />
              <InfoRow label="Tiền cọc" value={fmt(data.depositAmount)} />
              <InfoRow label="Tổng cần trả" value={fmt((data.rentalFee || 0) + (data.depositAmount || 0))} strong />
            </Section>

            {contract ? (
              <Section title="Thông tin gia hạn">
                {data.extendStatus === "pending" ? (
                  <>
                    <InfoRow label="Trạng thái" value="Đang chờ chủ đồ duyệt" />
                    <InfoRow label="Số ngày yêu cầu gia hạn" value={`${data.pendingExtendDays || 0} ngày`} />
                    <InfoRow label="Ngày kết thúc hiện tại" value={fmtDate(data.lastExtendOldEndDate || data.endDate)} />
                    <InfoRow label="Ngày kết thúc sau gia hạn" value={fmtDate(data.lastExtendNewEndDate || pendingNewEnd)} />
                    <InfoRow label="Phí gia hạn dự tính" value={fmt(data.pendingExtendFee)} />
                  </>
                ) : data.extendStatus === "approved" && data.lastExtendDays > 0 ? (
                  <>
                    <InfoRow label="Trạng thái" value="Đã được duyệt" />
                    <InfoRow label="Số ngày đã gia hạn" value={`${data.lastExtendDays} ngày`} />
                    <InfoRow label="Ngày kết thúc cũ" value={fmtDate(data.lastExtendOldEndDate)} />
                    <InfoRow label="Ngày kết thúc mới" value={fmtDate(data.lastExtendNewEndDate || data.endDate)} />
                    <InfoRow label="Phí gia hạn" value={fmt(data.lastExtendFee)} />
                    <InfoRow label="Thời điểm duyệt" value={fmtDateTime(data.lastExtendApprovedAt)} />
                  </>
                ) : data.extendStatus === "rejected" ? (
                  <InfoRow label="Trạng thái" value="Yêu cầu gia hạn gần nhất đã bị từ chối" />
                ) : (
                  <p className="text-sm text-gray-500">Chưa có yêu cầu gia hạn.</p>
                )}
              </Section>
            ) : null}

            {contract ? (
              <Section title="Trả đồ và tiền cọc">
                <InfoRow label="Trạng thái trả đồ" value={statusInfo.label} />
                <InfoRow label="Tiền bồi thường" value={fmt(data.compensationAmount)} />
                <InfoRow label="Tiền cọc hoàn lại" value={fmt(data.depositRefundAmount)} />
                <InfoRow label="Lý do trừ cọc / ghi chú phụ kiện" value={data.accessoriesNote} />
              </Section>
            ) : null}
          </div>
        </div>
      </div>
    </EcoTradeLayout>
  );
}
