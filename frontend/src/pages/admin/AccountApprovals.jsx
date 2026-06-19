import { useState, useEffect } from "react";
import Sidebar from "../../components/Sidebar";
import api from "../../services/api";
import toast from "react-hot-toast";

// verificationStatus của VerificationRequest: "pending" | "approved" | "rejected"
const TABS = ["Chờ duyệt", "Đã duyệt", "Từ chối"];
const FILTERS = ["pending", "approved", "rejected"];

const VER_COLOR = {
  pending: "bg-surface-container text-on-surface-variant",
  approved: "bg-secondary-container text-on-secondary-container",
  rejected: "bg-error-container text-on-error-container",
};
const VER_LABEL = { pending: "Chờ duyệt", approved: "Đã duyệt", rejected: "Từ chối" };

const AccountApprovals = () => {
  const [tab, setTab] = useState(0);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [rejectModal, setRejectModal] = useState(null); // request object
  const [rejectReason, setRejectReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/verification/admin/list?status=${FILTERS[tab]}`);
      if (res.data.success) setRequests(res.data.requests || []);
    } catch (err) {
      toast.error("Lỗi lấy danh sách xác minh");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRequests(); }, [tab]); // eslint-disable-line

  const handleApprove = async (reqId) => {
    if (!window.confirm("Xác nhận duyệt tài khoản này?")) return;
    setSubmitting(true);
    try {
      await api.put(`/verification/admin/${reqId}/approve`);
      toast.success("Đã duyệt thành công");
      fetchRequests();
    } catch (err) {
      toast.error(err.response?.data?.message || "Lỗi khi duyệt");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) return toast.error("Vui lòng nhập lý do từ chối");
    setSubmitting(true);
    try {
      await api.put(`/verification/admin/${rejectModal._id}/reject`, { rejectReason });
      toast.success("Đã từ chối");
      setRejectModal(null);
      setRejectReason("");
      fetchRequests();
    } catch (err) {
      toast.error(err.response?.data?.message || "Lỗi khi từ chối");
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (d) => new Date(d).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });

  return (
    <div className="flex min-h-screen bg-[#F5F5F7]">
      <Sidebar variant="admin" />
      <main className="flex-1 md:ml-64 px-4 md:px-10 py-10">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-on-surface">Duyệt tài khoản (KYC)</h1>
            <p className="text-on-surface-variant text-sm mt-1">Xem xét giấy tờ xác minh danh tính người dùng</p>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-surface-container rounded-xl p-1 w-fit mb-8">
            {TABS.map((t, i) => (
              <button key={t} onClick={() => setTab(i)}
                className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${tab === i ? "bg-surface-container-lowest text-on-surface shadow-sm" : "text-on-surface-variant hover:text-on-surface"
                  }`}>
                {t}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="text-center py-16 flex flex-col items-center gap-3 text-on-surface-variant">
              <span className="material-symbols-outlined text-3xl animate-spin text-primary">refresh</span>
              <p className="text-sm">Đang tải...</p>
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-16 flex flex-col items-center gap-3 text-on-surface-variant">
              <span className="material-symbols-outlined text-5xl opacity-30">how_to_reg</span>
              <p className="text-sm">Không có yêu cầu nào trong mục này.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {requests.map((req) => {
                const u = req.userId || {};
                const displayName = u.fullName || u.name || "Người dùng";
                return (
                  <div key={req._id} className="bg-surface-container-lowest rounded-2xl shadow-apple border border-surface-variant/30 p-5">
                    <div className="flex items-start justify-between gap-4">
                      {/* User info */}
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-base flex-shrink-0">
                          {displayName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-on-surface">{displayName}</p>
                          <p className="text-sm text-on-surface-variant">{u.email} {u.phone ? `• ${u.phone}` : ""}</p>
                          <p className="text-xs text-on-surface-variant mt-0.5">
                            Đăng ký: {u.createdAt ? formatDate(u.createdAt) : "—"} •
                            Gửi yêu cầu: {formatDate(req.createdAt)}
                          </p>
                        </div>
                      </div>

                      {/* Status badge */}
                      <span className={`text-xs px-2.5 py-1 rounded-full font-semibold flex-shrink-0 ${VER_COLOR[req.status]}`}>
                        {VER_LABEL[req.status]}
                      </span>
                    </div>

                    {/* Giấy tờ */}
                    {(u.citizenIdUrl || u.studentCardUrl) && (
                      <div className="flex gap-3 mt-4 flex-wrap">
                        {u.citizenIdUrl && (
                          <a href={u.citizenIdUrl.startsWith("http") ? u.citizenIdUrl : `http://localhost:5000${u.citizenIdUrl}`}
                            target="_blank" rel="noreferrer"
                            className="flex items-center gap-1.5 px-3 py-2 bg-surface-container-low border border-surface-variant rounded-lg text-xs font-medium text-primary hover:bg-surface-container transition-colors">
                            <span className="material-symbols-outlined text-[16px]">id_card</span>
                            Xem CCCD
                          </a>
                        )}
                        {u.studentCardUrl && (
                          <a href={u.studentCardUrl.startsWith("http") ? u.studentCardUrl : `http://localhost:5000${u.studentCardUrl}`}
                            target="_blank" rel="noreferrer"
                            className="flex items-center gap-1.5 px-3 py-2 bg-surface-container-low border border-surface-variant rounded-lg text-xs font-medium text-primary hover:bg-surface-container transition-colors">
                            <span className="material-symbols-outlined text-[16px]">school</span>
                            Xem Thẻ SV
                          </a>
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    {req.status === "pending" && (
                      <div className="flex gap-3 mt-4 pt-4 border-t border-surface-variant/40">
                        <button onClick={() => handleApprove(req._id)} disabled={submitting}
                          className="px-5 py-2.5 bg-primary text-on-primary rounded-xl text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-50 flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[16px]">check_circle</span>
                          Duyệt tài khoản
                        </button>
                        <button onClick={() => setRejectModal(req)} disabled={submitting}
                          className="px-5 py-2.5 border border-error/30 text-error rounded-xl text-sm font-semibold hover:bg-error/5 transition-all disabled:opacity-50 flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[16px]">cancel</span>
                          Từ chối
                        </button>
                      </div>
                    )}

                    {/* Lý do từ chối */}
                    {req.status === "rejected" && req.rejectReason && (
                      <div className="mt-4 pt-4 border-t border-surface-variant/40">
                        <p className="text-xs text-on-surface-variant">
                          <span className="font-semibold text-error">Lý do từ chối: </span>
                          {req.rejectReason}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Modal từ chối */}
      {rejectModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-apple-md border border-surface-variant w-full max-w-md">
            <h3 className="font-bold text-on-surface mb-1">Từ chối xác minh</h3>
            <p className="text-sm text-on-surface-variant mb-4">
              {rejectModal.userId?.fullName || "Người dùng"}
            </p>
            <label className="block text-sm font-medium text-on-surface mb-1.5">
              Lý do từ chối <span className="text-error">*</span>
            </label>
            <textarea
              className="w-full px-4 py-3 border border-surface-variant rounded-xl text-sm bg-surface-bright focus:border-error outline-none resize-none min-h-[100px] transition-all mb-4"
              placeholder="VD: Ảnh CCCD không rõ nét, thông tin không khớp..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
            <div className="flex gap-3">
              <button onClick={() => { setRejectModal(null); setRejectReason(""); }} disabled={submitting}
                className="flex-1 py-2.5 border border-surface-variant rounded-xl text-sm font-medium hover:bg-surface-container-low transition-all">
                Hủy
              </button>
              <button onClick={handleReject} disabled={submitting}
                className="flex-1 py-2.5 bg-error text-on-error rounded-xl text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-50">
                {submitting ? "Đang xử lý..." : "Xác nhận từ chối"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default AccountApprovals;
